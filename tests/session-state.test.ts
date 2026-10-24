import { describe, expect, it } from "vitest";
import { isQuotaError, shouldSaveSession } from "@/lib/db/session-state";

describe("session save guard", () => {
  it("saves only after hydrate and a user edit", () => {
    expect(shouldSaveSession(false, true)).toBe(false);
    expect(shouldSaveSession(true, false)).toBe(false);
    expect(shouldSaveSession(true, true)).toBe(true);
  });

  it("recognizes a storage quota error", () => {
    expect(isQuotaError({ name: "QuotaExceededError" })).toBe(true);
    expect(isQuotaError({ name: "NS_ERROR_DOM_QUOTA_REACHED" })).toBe(true);
    expect(isQuotaError(new Error("disk full"))).toBe(false);
    expect(isQuotaError(null)).toBe(false);
    expect(isQuotaError("QuotaExceededError")).toBe(false);
  });
});
