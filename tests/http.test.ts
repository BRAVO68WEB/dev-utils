import { describe, expect, it } from "vitest";
import { executeRequest } from "@/lib/http/execute";
import { buildOutbound, metadataBlocked, type Outbound } from "@/lib/http/outbound";
import { parseCurl } from "@/lib/parsers/curl";
import { parseHttpMessage, parseRequestText } from "@/lib/parsers/http-message";
import { fieldRow, type HttpDraft } from "@/lib/types";

function draft(partial: Partial<HttpDraft> & Pick<HttpDraft, "url">): HttpDraft {
  return {
    method: "GET",
    query: [],
    headers: [],
    body: "",
    bodyType: "none",
    allowMetadata: false,
    ...partial,
  };
}

describe("curl parser", () => {
  it("reads a post with a header and form data", () => {
    const result = parseCurl("curl -X POST https://example.com/items -H 'Accept: text/plain' -d 'name=ada'");
    expect(result.error).toBeNull();
    expect(result.draft?.method).toBe("POST");
    expect(result.draft?.url).toBe("https://example.com/items");
    expect(result.draft?.bodyType).toBe("form");
    expect(result.draft?.body).toBe("name=ada");
    expect(result.draft?.headers.map((header) => [header.name, header.value])).toEqual([["Accept", "text/plain"]]);
  });

  it("treats --json as a json body and adds a content type", () => {
    const result = parseCurl(`curl --json '{"ok":true}' https://example.com/v1`);
    expect(result.draft?.method).toBe("POST");
    expect(result.draft?.bodyType).toBe("json");
    expect(result.draft?.body).toBe('{"ok":true}');
    expect(result.draft?.headers.some((header) => header.name === "Content-Type" && header.value === "application/json")).toBe(true);
  });

  it("encodes basic auth and records ignored and unsupported flags", () => {
    const auth = parseCurl("curl -u user:pass https://example.com/");
    expect(auth.draft?.headers[0]?.value).toBe("Basic dXNlcjpwYXNz");

    const ignored = parseCurl("curl -k https://example.com/");
    expect(ignored.ignored).toContain("-k");
    expect(ignored.draft?.method).toBe("GET");

    const unknown = parseCurl("curl --foo https://example.com/next");
    expect(unknown.unsupported).toContain("--foo");
    expect(unknown.draft?.url).toBe("https://example.com/next");

    const retry = parseCurl("curl --retry 3 https://example.com/x");
    expect(retry.unsupported).toContain("--retry");
    expect(retry.draft?.url).toBe("https://example.com/x");
  });

  it("joins a backslash newline continuation", () => {
    const result = parseCurl("curl https://example.com/hooks \\\n  -H 'X-Name: Ada'");
    expect(result.draft?.url).toBe("https://example.com/hooks");
    expect(result.draft?.headers.map((header) => [header.name, header.value])).toEqual([["X-Name", "Ada"]]);
  });
});

describe("raw http parser", () => {
  it("builds an http url for localhost and keeps an absolute url", () => {
    const local = parseHttpMessage("GET /health HTTP/1.1\nHost: localhost:3000\n\n");
    expect(local.draft?.url).toBe("http://localhost:3000/health");
    expect(local.draft?.method).toBe("GET");

    const absolute = parseHttpMessage("GET https://example.com/a?b=1 HTTP/1.1\n\n");
    expect(absolute.draft?.url).toBe("https://example.com/a?b=1");
    expect(absolute.draft?.query.map((row) => [row.name, row.value])).toEqual([["b", "1"]]);
  });

  it("requires a host for an origin-form request", () => {
    const missing = parseHttpMessage("GET /health HTTP/1.1\n\n");
    expect(missing.draft).toBeNull();
    expect(missing.error).toMatch(/Host/);
  });

  it("dispatches curl and raw text", () => {
    expect(parseRequestText("curl https://example.com/").draft?.method).toBe("GET");
    expect(parseRequestText("POST https://example.com/v1 HTTP/1.1\n\n").draft?.method).toBe("POST");
    expect(parseRequestText("hello").draft).toBeNull();
  });
});

describe("outbound request", () => {
  it("blocks cloud metadata hosts until they are allowed", () => {
    expect(metadataBlocked("http://169.254.169.254/latest/meta-data", false)).toBe(true);
    expect(metadataBlocked("http://169.254.169.254/latest/meta-data", true)).toBe(false);
    expect(metadataBlocked("http://metadata.google.internal/", false)).toBe(true);
    expect(metadataBlocked("http://127.0.0.1:3000/in/inbox", false)).toBe(false);
  });

  it("rejects a non-http url and a metadata host", () => {
    expect(buildOutbound(draft({ url: "ftp://example.com/file" })).ok).toBe(false);
    const blocked = buildOutbound(draft({ url: "http://169.254.169.254/latest" }));
    expect(blocked.ok).toBe(false);
    const allowed = buildOutbound(draft({ url: "http://169.254.169.254/latest", allowMetadata: true }));
    expect(allowed.ok).toBe(true);
  });

  it("drops hop headers and omits a body on GET", () => {
    const result = buildOutbound(
      draft({
        method: "GET",
        url: "https://example.com/search?old=1",
        query: [fieldRow("q", "ada")],
        headers: [fieldRow("Host", "evil.example"), fieldRow("Accept", "text/plain")],
        body: "{\"no\":true}",
        bodyType: "json",
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.url).toBe("https://example.com/search?q=ada");
    expect(result.request.body).toBeNull();
    expect(result.request.headers).toEqual([["Accept", "text/plain"]]);
  });

  it("adds a json content type when the body is sent", () => {
    const result = buildOutbound(
      draft({
        method: "POST",
        url: "https://example.com/v1",
        body: "{}",
        bodyType: "json",
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.body).toBe("{}");
    expect(result.request.headers).toEqual([["Content-Type", "application/json"]]);
  });
});

describe("executeRequest", () => {
  it("follows a POST 302 as a GET and returns the final body", async () => {
    const seen: { method: string; url: string; body: BodyInit | null | undefined }[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      seen.push({ method: init?.method ?? "", url: String(input), body: init?.body });
      if (seen.length === 1) return new Response(null, { status: 302, headers: { location: "/done" } });
      return new Response("finished", { status: 200, headers: { "content-type": "text/plain" } });
    };
    const request: Outbound = {
      url: "https://example.com/start",
      method: "POST",
      headers: [["Content-Type", "application/json"]],
      body: '{"a":1}',
    };
    const result = await executeRequest(request, false, fetchImpl);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.response.status).toBe(200);
    expect(result.response.body).toBe("finished");
    expect(result.response.redirects).toEqual([{ url: "https://example.com/start", status: 302 }]);
    expect(seen[1]).toMatchObject({ method: "GET", url: "https://example.com/done", body: null });
  });

  it("stops when a redirect points at a metadata host", async () => {
    let calls = 0;
    const fetchImpl: typeof fetch = async () => {
      calls += 1;
      return new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest" } });
    };
    const result = await executeRequest(
      { url: "https://example.com/start", method: "GET", headers: [], body: null },
      false,
      fetchImpl,
    );
    expect(result).toMatchObject({ ok: false, status: 400 });
    expect(calls).toBe(1);
  });
});
