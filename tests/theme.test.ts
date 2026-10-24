import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTheme, readThemeChoice, themeLabel, THEME_KEY } from "@/lib/theme";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("theme choice", () => {
  it("cycles system, light, and Dracula", () => {
    expect(nextTheme("system")).toBe("light");
    expect(nextTheme("light")).toBe("dracula");
    expect(nextTheme("dracula")).toBe("system");
    expect(themeLabel("dracula")).toBe("Dracula");
  });

  it("reads a stored dark choice as Dracula", () => {
    const values = new Map<string, string>([[THEME_KEY, "dark"]]);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    expect(readThemeChoice()).toBe("dracula");
  });
});
