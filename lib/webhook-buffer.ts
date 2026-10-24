import { WEBHOOK_QUEUE_CAP } from "@/lib/limits";
import type { WebhookEventBody } from "@/lib/types";

export type MockResponse = {
  status: number;
  body: string;
  contentType: string;
};

type Runtime = {
  mock: MockResponse;
  queue: WebhookEventBody[];
  listeners: Set<(event: WebhookEventBody) => void>;
};

const DEFAULT_MOCK: MockResponse = {
  status: 200,
  body: '{"ok":true}',
  contentType: "application/json",
};

const globalStore = globalThis as typeof globalThis & {
  __devUtilsHooks?: Map<string, Runtime>;
};

function store() {
  globalStore.__devUtilsHooks ??= new Map();
  return globalStore.__devUtilsHooks;
}

function runtime(token: string) {
  const map = store();
  let inbox = map.get(token);
  if (!inbox) {
    inbox = { mock: { ...DEFAULT_MOCK }, queue: [], listeners: new Set() };
    map.set(token, inbox);
  }
  return inbox;
}

export function registerMock(token: string, mock: MockResponse) {
  const status = Number.isInteger(mock.status) && mock.status >= 100 && mock.status <= 599 ? mock.status : 200;
  runtime(token).mock = {
    status,
    body: mock.body ?? "",
    contentType: mock.contentType || "application/json",
  };
}

export function getMock(token: string) {
  return runtime(token).mock;
}

export function enqueue(token: string, event: WebhookEventBody) {
  const inbox = runtime(token);
  inbox.queue.push(event);
  if (inbox.queue.length > WEBHOOK_QUEUE_CAP) {
    inbox.queue.splice(0, inbox.queue.length - WEBHOOK_QUEUE_CAP);
  }
  for (const listener of inbox.listeners) listener(event);
}

export function listQueue(token: string) {
  return [...runtime(token).queue];
}

export function ack(token: string, ids: string[]) {
  const drop = new Set(ids);
  const inbox = runtime(token);
  inbox.queue = inbox.queue.filter((event) => !drop.has(event.id));
}

export function subscribe(token: string, listener: (event: WebhookEventBody) => void) {
  const inbox = runtime(token);
  inbox.listeners.add(listener);
  return () => inbox.listeners.delete(listener);
}

export function clearInbox(token: string) {
  const inbox = runtime(token);
  inbox.queue = [];
}
