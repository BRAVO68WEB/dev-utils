import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from "idb";
import { publish } from "@/lib/db/channel";
import { HTTP_HISTORY_CAP, WEBHOOK_EVENT_CAP } from "@/lib/limits";
import { kindsForTool } from "@/lib/tools";
import type {
  Dump,
  RecordKind,
  SessionRow,
  SessionStateMap,
  SettingRow,
  ToolId,
  ToolRecord,
} from "@/lib/types";

interface DevDB extends DBSchema {
  sessions: { key: string; value: SessionRow };
  records: {
    key: string;
    value: ToolRecord;
    indexes: { kind: RecordKind; parentId: string; updatedAt: number };
  };
  settings: { key: string; value: SettingRow };
}

export const DB_NAME = "dev-utils";
export const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DevDB>> | null = null;

export async function closeDevDb() {
  if (!dbPromise) return;
  const db = await dbPromise;
  db.close();
  dbPromise = null;
}

export function openDevDb() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this browser."));
  }
  dbPromise ??= openDB<DevDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore("sessions", { keyPath: "tool" });
      const records = db.createObjectStore("records", { keyPath: "id" });
      records.createIndex("kind", "kind");
      records.createIndex("parentId", "parentId");
      records.createIndex("updatedAt", "updatedAt");
      db.createObjectStore("settings", { keyPath: "key" });
    },
  });
  return dbPromise;
}

export async function getSession<K extends ToolId>(tool: K) {
  const db = await openDevDb();
  const row = await db.get("sessions", tool);
  if (!row) return null;
  return row.state as SessionStateMap[K];
}

export async function putSession<K extends ToolId>(tool: K, state: SessionStateMap[K]) {
  const db = await openDevDb();
  await db.put("sessions", { tool, updatedAt: Date.now(), state });
  publish({ store: "sessions", key: tool });
}

export async function listSessionTimes() {
  const db = await openDevDb();
  const rows = await db.getAll("sessions");
  return rows.map((row) => ({ tool: row.tool, updatedAt: row.updatedAt }));
}

export async function putSetting(key: string, value: unknown) {
  const db = await openDevDb();
  await db.put("settings", { key, value });
  publish({ store: "settings", key });
}

export async function getSetting<T>(key: string) {
  const db = await openDevDb();
  const row = await db.get("settings", key);
  return (row?.value as T | undefined) ?? null;
}

export type Caps = { http: number; events: number };

export async function putRecord<T>(record: ToolRecord<T>, caps?: Caps) {
  const db = await openDevDb();
  await db.put("records", record as ToolRecord);
  await trimRecords(record, caps);
  publish({ store: "records", key: record.id });
}

async function trimRecords(record: ToolRecord, caps: Caps = { http: HTTP_HISTORY_CAP, events: WEBHOOK_EVENT_CAP }) {
  if (record.kind === "http") {
    await deleteOldest(await listByKind("http"), caps.http);
  }
  if (record.kind === "webhook-event" && record.parentId) {
    const rows = (await listByParent(record.parentId)).filter((row) => row.kind === "webhook-event");
    await deleteOldest(rows, caps.events);
  }
}

async function deleteOldest(rows: ToolRecord[], cap: number) {
  const extra = rows.length - cap;
  if (extra <= 0) return;
  const oldest = [...rows].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)).slice(0, extra);
  const db = await openDevDb();
  const tx = db.transaction("records", "readwrite");
  for (const row of oldest) await tx.store.delete(row.id);
  await tx.done;
}

export async function getRecord<T>(id: string) {
  const db = await openDevDb();
  const row = await db.get("records", id);
  return (row as ToolRecord<T> | undefined) ?? null;
}

export async function listByKind<T>(kind: RecordKind) {
  const db = await openDevDb();
  const rows = await db.getAllFromIndex("records", "kind", kind);
  return rows as ToolRecord<T>[];
}

export async function listByParent<T>(parentId: string) {
  const db = await openDevDb();
  const rows = await db.getAllFromIndex("records", "parentId", parentId);
  return rows as ToolRecord<T>[];
}

export async function deleteRecord(id: string) {
  const db = await openDevDb();
  await db.delete("records", id);
  publish({ store: "records", key: id });
}

export async function deleteByParent(parentId: string) {
  const rows = await listByParent(parentId);
  const db = await openDevDb();
  const tx = db.transaction("records", "readwrite");
  for (const row of rows) await tx.store.delete(row.id);
  await tx.done;
  publish({ store: "records", key: parentId });
}

export async function clearTool(tool: ToolId) {
  const db = await openDevDb();
  await db.delete("sessions", tool);
  const kinds = kindsForTool(tool);
  if (kinds.length > 0) {
    const tx = db.transaction("records", "readwrite");
    for (const kind of kinds) {
      const rows = await tx.store.index("kind").getAll(kind);
      for (const row of rows) await tx.store.delete(row.id);
    }
    await tx.done;
  }
  publish({ store: "sessions", key: tool, reason: "reset" });
  publish({ store: "records", key: tool, reason: "reset" });
}

export async function exportAll(): Promise<Dump> {
  const db = await openDevDb();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions: await db.getAll("sessions"),
    records: await db.getAll("records"),
    settings: await db.getAll("settings"),
  };
}

export async function exportTool(tool: ToolId): Promise<Dump> {
  const db = await openDevDb();
  const session = await db.get("sessions", tool);
  const records: ToolRecord[] = [];
  for (const kind of kindsForTool(tool)) {
    records.push(...(await listByKind(kind)));
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions: session ? [session] : [],
    records,
    settings: [],
  };
}

export function isDump(value: unknown): value is Dump {
  if (!value || typeof value !== "object") return false;
  const dump = value as Partial<Dump>;
  return dump.version === 1 && Array.isArray(dump.sessions) && Array.isArray(dump.records) && Array.isArray(dump.settings);
}

export async function importDump(dump: Dump) {
  const db = await openDevDb();
  const tx = db.transaction(["sessions", "records", "settings"], "readwrite");
  for (const session of dump.sessions) await tx.objectStore("sessions").put(session);
  for (const record of dump.records) await tx.objectStore("records").put(record);
  for (const setting of dump.settings) await tx.objectStore("settings").put(setting);
  await tx.done;
  publish({ store: "sessions", key: "*", reason: "reset" });
  publish({ store: "records", key: "*", reason: "reset" });
  publish({ store: "settings", key: "*", reason: "reset" });
}

export async function clearAll() {
  await closeDevDb();
  await deleteDB(DB_NAME);
  publish({ store: "sessions", key: "*", reason: "reset" });
  publish({ store: "records", key: "*", reason: "reset" });
}
