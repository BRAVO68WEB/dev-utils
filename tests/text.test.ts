import { describe, expect, it } from "vitest";
import { decodeBase64, decodeToBytes, describeBody, encodeBytes, encodeUtf8 } from "@/lib/text/base64";
import { summarizeDiff } from "@/lib/text/diff";
import { grepLines } from "@/lib/text/grep";
import { parseParams, updateParams } from "@/lib/text/params";
import { transformUrl } from "@/lib/text/url";
import { inspectYaml } from "@/lib/text/yaml";

describe("url encode and decode", () => {
  it("encodes a component and a whole URI differently", () => {
    expect(transformUrl("a b", "encode", "component", false).output).toBe("a%20b");
    expect(transformUrl("a/b?c", "encode", "component", false).output).toBe("a%2Fb%3Fc");
    expect(transformUrl("a/b?c", "encode", "uri", false).output).toBe("a/b?c");
    expect(transformUrl("+", "encode", "component", false).output).toBe("%2B");
  });

  it("decodes plus as a space only when asked, and reports a broken percent sequence", () => {
    expect(transformUrl("a+b", "decode", "component", true)).toEqual({ output: "a b", error: null });
    expect(transformUrl("a+b", "decode", "component", false)).toEqual({ output: "a+b", error: null });
    expect(transformUrl("caf%C3%A9", "decode", "component", false).output).toBe("café");
    const broken = transformUrl("%", "decode", "component", false);
    expect(broken.output).toBe("");
    expect(broken.error).toBeTruthy();
  });
});

describe("url params", () => {
  it("keeps duplicate keys, empty values, and the hash", () => {
    const parsed = parseParams("https://example.com/search?tag=a&tag=b&q=#top");
    expect(parsed).toEqual({
      ok: true,
      rows: [
        { name: "tag", value: "a" },
        { name: "tag", value: "b" },
        { name: "q", value: "" },
      ],
      hash: "#top",
    });
  });

  it("rewrites the query and skips a blank name", () => {
    const next = updateParams("https://example.com/path?x=1#h", [
      { name: "", value: "skip" },
      { name: "x", value: "2" },
      { name: "x", value: "" },
    ]);
    expect(next).toBe("https://example.com/path?x=2&x=#h");
  });

  it("rejects an empty string and a non-url", () => {
    expect(parseParams("  ").ok).toBe(false);
    expect(parseParams("not a url").ok).toBe(false);
  });
});

describe("base64", () => {
  it("round-trips unicode and the url-safe alphabet", () => {
    const text = "héllo 😀";
    expect(decodeBase64(encodeUtf8(text, false), false)).toEqual({ text, error: null });
    const bytes = new Uint8Array([0xfb, 0xef, 0xff]);
    expect(encodeBytes(bytes, false)).toBe("++//");
    expect(encodeBytes(bytes, true)).toBe("--__");
    expect([...decodeToBytes(encodeBytes(bytes, true), true)]).toEqual([0xfb, 0xef, 0xff]);
  });

  it("describes a nul byte as base64 and text as utf-8", () => {
    expect(describeBody(new Uint8Array([104, 105]))).toEqual({ body: "hi", bodyEncoding: "utf8" });
    const binary = describeBody(new Uint8Array([0, 1]));
    expect(binary.bodyEncoding).toBe("base64");
    expect(binary.body).toBe(encodeBytes(new Uint8Array([0, 1]), false));
  });
});

describe("grep", () => {
  const base = { literal: false, insensitive: false, invert: false, before: 0, after: 0 };

  it("reports an invalid expression", () => {
    const result = grepLines("abc", { ...base, pattern: "(" });
    expect(result.rows).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it("folds case, inverts, and includes context lines", () => {
    const folded = grepLines("Ada\nada", { ...base, pattern: "ada", insensitive: true });
    expect(folded.rows.map((row) => row.line)).toEqual([1, 2]);

    const inverted = grepLines("a\nb", { ...base, pattern: "a", invert: true });
    expect(inverted.rows).toEqual([{ line: 2, text: "b", match: true, ranges: [] }]);

    const context = grepLines("one\ntwo\nthree\nfour", { ...base, pattern: "three", before: 1, after: 1 });
    expect(context.rows.map((row) => [row.line, row.match])).toEqual([
      [2, false],
      [3, true],
      [4, false],
    ]);
    expect(context.rows[1]?.ranges).toEqual([[0, 5]]);
  });

  it("treats a literal pattern as plain text", () => {
    const result = grepLines("a.c\nabc", { ...base, pattern: "a.c", literal: true });
    expect(result.rows.map((row) => row.line)).toEqual([1]);
  });
});

describe("yaml", () => {
  it("returns json for a valid document", () => {
    const report = inspectYaml("name: Ada\ncount: 2\n");
    expect(report.problems).toEqual([]);
    expect(JSON.parse(report.json ?? "")).toEqual({ name: "Ada", count: 2 });
  });

  it("warns on a duplicate key and still returns json", () => {
    const report = inspectYaml("a: 1\na: 2\n");
    expect(report.problems.some((problem) => problem.severity === "warning")).toBe(true);
    expect(report.problems.some((problem) => problem.severity === "error")).toBe(false);
    expect(JSON.parse(report.json ?? "")).toEqual({ a: 2 });
  });

  it("reports a syntax error with a line", () => {
    const report = inspectYaml("a: [\n");
    expect(report.json).toBeNull();
    expect(report.problems[0]?.severity).toBe("error");
    expect(report.problems[0]?.line).toBeGreaterThan(0);
  });
});

describe("diff", () => {
  it("counts a replaced line and records character offsets", () => {
    const summary = summarizeDiff("alpha\nbeta\n", "alpha\ngamma\n", false);
    expect(summary.added).toBe(1);
    expect(summary.removed).toBe(1);
    expect(summary.changes).toEqual([{ fromA: 6, toA: 9, fromB: 6, toB: 10 }]);
  });

  it("ignores a trailing-space change when asked", () => {
    const changed = summarizeDiff("alpha \nbeta\n", "alpha\nbeta\n", false);
    expect(changed.added + changed.removed).toBeGreaterThan(0);
    const ignored = summarizeDiff("alpha \nbeta\n", "alpha\nbeta\n", true);
    expect(ignored).toEqual({ added: 0, removed: 0, changes: [] });
  });
});
