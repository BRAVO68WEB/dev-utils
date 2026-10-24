export type DbStore = "sessions" | "records" | "settings";

export type DbReason = "write" | "reset";

export type DbMessage = {
  store: DbStore;
  key: string;
  source: string;
  reason: DbReason;
};

export const dbSource =
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "dev-utils";

const listeners = new Set<(message: DbMessage) => void>();

export function publish(message: { store: DbStore; key: string; reason?: DbReason }) {
  const payload: DbMessage = { reason: "write", ...message, source: dbSource };
  for (const listener of listeners) listener(payload);
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel("dev-utils");
  channel.postMessage(payload);
  channel.close();
}

export function subscribe(handler: (message: DbMessage) => void) {
  listeners.add(handler);
  if (typeof BroadcastChannel === "undefined") {
    return () => listeners.delete(handler);
  }
  const channel = new BroadcastChannel("dev-utils");
  channel.onmessage = (event: MessageEvent<DbMessage>) => {
    if (!event.data || event.data.source === dbSource) return;
    handler(event.data);
  };
  return () => {
    listeners.delete(handler);
    channel.close();
  };
}
