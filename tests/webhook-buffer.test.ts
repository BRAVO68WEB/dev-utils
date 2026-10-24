import { describe, expect, it } from "vitest";
import { WEBHOOK_QUEUE_CAP } from "@/lib/limits";
import type { WebhookEventBody } from "@/lib/types";
import { ack, clearInbox, enqueue, getMock, listQueue, registerMock, subscribe } from "@/lib/webhook-buffer";

function event(id: string): WebhookEventBody {
  return {
    id,
    method: "POST",
    path: "/hooks",
    query: [],
    headers: [],
    body: "",
    bodyEncoding: "utf8",
    truncated: false,
    contentType: "application/json",
    receivedAt: 1,
  };
}

describe("webhook buffer", () => {
  it("caps the unacked queue and drops acknowledged ids", () => {
    const token = `cap-${crypto.randomUUID()}`;
    for (let index = 0; index < WEBHOOK_QUEUE_CAP + 1; index += 1) enqueue(token, event(`e-${index}`));
    const queued = listQueue(token);
    expect(queued).toHaveLength(WEBHOOK_QUEUE_CAP);
    expect(queued[0]?.id).toBe("e-1");
    expect(queued.at(-1)?.id).toBe(`e-${WEBHOOK_QUEUE_CAP}`);

    ack(token, ["e-1", "missing"]);
    expect(listQueue(token).some((item) => item.id === "e-1")).toBe(false);
    expect(listQueue(token)).toHaveLength(WEBHOOK_QUEUE_CAP - 1);
  });

  it("notifies subscribers and keeps the mock when the queue is cleared", () => {
    const token = `mock-${crypto.randomUUID()}`;
    const seen: string[] = [];
    const stop = subscribe(token, (item) => seen.push(item.id));
    enqueue(token, event("one"));
    stop();
    enqueue(token, event("two"));
    expect(seen).toEqual(["one"]);

    registerMock(token, { status: 700, body: "nope", contentType: "text/plain" });
    expect(getMock(token).status).toBe(200);
    registerMock(token, { status: 202, body: "accepted", contentType: "text/plain" });
    clearInbox(token);
    expect(listQueue(token)).toEqual([]);
    expect(getMock(token)).toEqual({ status: 202, body: "accepted", contentType: "text/plain" });
  });
});
