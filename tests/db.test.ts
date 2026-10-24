import { deleteDB } from "idb";
import { beforeEach, describe, expect, it } from "vitest";
import {
  DB_NAME,
  clearAll,
  clearTool,
  closeDevDb,
  exportAll,
  exportTool,
  getRecord,
  getSession,
  getSetting,
  importDump,
  isDump,
  listByKind,
  listByParent,
  putRecord,
  putSession,
  putSetting,
} from "@/lib/db/index";
import type { ToolRecord } from "@/lib/types";

const caps = { http: 3, events: 2 };

function record(partial: Partial<ToolRecord> & Pick<ToolRecord, "id" | "kind" | "createdAt">): ToolRecord {
  return {
    parentId: null,
    updatedAt: partial.createdAt,
    title: partial.id,
    body: { ok: true },
    ...partial,
  };
}

async function resetDb() {
  await closeDevDb();
  await deleteDB(DB_NAME);
}

describe("indexedDB repository", () => {
  beforeEach(resetDb);

  it("round-trips a session, a record, and a setting", async () => {
    await putSession("url", { input: "a b", mode: "encode", variant: "component", plusAsSpace: false });
    await putRecord(record({ id: "doc-1", kind: "markdown", createdAt: 10, title: "Notes", body: { markdown: "# Hi", comments: [] } }));
    await putSetting("last-tool", "url");

    expect(await getSession("url")).toEqual({ input: "a b", mode: "encode", variant: "component", plusAsSpace: false });
    expect((await getRecord("doc-1"))?.title).toBe("Notes");
    expect(await getSetting("last-tool")).toBe("url");
    expect(await listByKind("markdown")).toHaveLength(1);
  });

  it("trims http history and webhook events to the supplied caps", async () => {
    for (let index = 1; index <= 5; index += 1) {
      await putRecord(record({ id: `http-${index}`, kind: "http", createdAt: index }), caps);
    }
    const http = (await listByKind("http")).map((row) => row.id).sort();
    expect(http).toEqual(["http-3", "http-4", "http-5"]);

    for (let index = 1; index <= 4; index += 1) {
      await putRecord(
        record({ id: `event-${index}`, kind: "webhook-event", parentId: "inbox-a", createdAt: index }),
        caps,
      );
    }
    await putRecord(record({ id: "event-other", kind: "webhook-event", parentId: "inbox-b", createdAt: 1 }), caps);
    const kept = (await listByParent("inbox-a")).map((row) => row.id).sort();
    expect(kept).toEqual(["event-3", "event-4"]);
    expect(await getRecord("event-other")).not.toBeNull();
  });

  it("exports, clears, and imports by primary key", async () => {
    await putSession("yaml", { source: "a: 1" });
    await putRecord(record({ id: "uml-1", kind: "uml", createdAt: 4, title: "Diagram" }));
    await putSetting("theme", "dark");
    const dump = await exportAll();

    expect(isDump(dump)).toBe(true);
    expect(isDump(null)).toBe(false);
    expect(isDump({ version: 2, sessions: [], records: [], settings: [] })).toBe(false);

    await clearAll();
    expect(await getSession("yaml")).toBeNull();
    expect(await getRecord("uml-1")).toBeNull();

    await importDump(dump);
    expect(await getSession("yaml")).toEqual({ source: "a: 1" });
    expect((await getRecord("uml-1"))?.title).toBe("Diagram");
    expect(await getSetting("theme")).toBe("dark");
  });

  it("clears one tool and leaves the others", async () => {
    await putSession("http", {
      method: "GET",
      url: "https://example.com",
      query: [],
      headers: [],
      body: "",
      bodyType: "none",
      allowMetadata: false,
    });
    await putSession("markdown", { activeId: "doc-1" });
    await putRecord(record({ id: "call-1", kind: "http", createdAt: 1 }));
    await putRecord(record({ id: "doc-1", kind: "markdown", createdAt: 2, title: "Keep" }));

    await clearTool("http");

    expect(await getSession("http")).toBeNull();
    expect(await getRecord("call-1")).toBeNull();
    expect(await getSession("markdown")).toEqual({ activeId: "doc-1" });
    expect(await getRecord("doc-1")).not.toBeNull();
  });

  it("exports only the selected tool", async () => {
    await putSession("uml", { activeId: "uml-1" });
    await putRecord(record({ id: "uml-1", kind: "uml", createdAt: 1 }));
    await putRecord(record({ id: "doc-1", kind: "markdown", createdAt: 2 }));
    const dump = await exportTool("uml");
    expect(dump.sessions.map((row) => row.tool)).toEqual(["uml"]);
    expect(dump.records.map((row) => row.id)).toEqual(["uml-1"]);
    expect(dump.settings).toEqual([]);
  });
});
