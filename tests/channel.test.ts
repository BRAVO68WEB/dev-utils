import { describe, expect, it } from "vitest";
import { publish, subscribe } from "@/lib/db/channel";

describe("database channel", () => {
  it("notifies listeners in this tab and stops after unsubscribe", () => {
    const seen: string[] = [];
    const stop = subscribe((message) => {
      seen.push(`${message.store}:${message.key}:${message.reason}`);
    });
    publish({ store: "records", key: "note-1" });
    stop();
    publish({ store: "records", key: "note-2" });
    expect(seen).toEqual(["records:note-1:write"]);
  });
});
