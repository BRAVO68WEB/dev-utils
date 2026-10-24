import { parseCurl } from "@/lib/parsers/curl";
import { fieldRow, type HttpDraft } from "@/lib/types";

export function parseHttpMessage(input: string): {
  draft: HttpDraft | null;
  error: string | null;
  ignored: string[];
  unsupported: string[];
} {
  const normalized = input.replaceAll("\r\n", "\n").replace(/^\uFEFF/, "");
  const splitAt = normalized.indexOf("\n\n");
  const head = splitAt === -1 ? normalized : normalized.slice(0, splitAt);
  const body = splitAt === -1 ? "" : normalized.slice(splitAt + 2);
  const lines = head.split("\n");
  const requestLine = lines[0]?.trim() ?? "";
  const match = requestLine.match(/^([A-Za-z]+)\s+(\S+)(?:\s+HTTP\/\d(?:\.\d)?)?$/);
  if (!match) {
    return {
      draft: null,
      error: "The first line must be a request line, for example GET /path HTTP/1.1.",
      ignored: [],
      unsupported: [],
    };
  }

  const method = match[1]?.toUpperCase() ?? "GET";
  const target = match[2] ?? "/";
  const headers = lines.slice(1).flatMap((line) => {
    if (!line.trim()) return [];
    const index = line.indexOf(":");
    if (index === -1) return [];
    return [fieldRow(line.slice(0, index).trim(), line.slice(index + 1).trim())];
  });

  let url = target;
  if (!/^https?:\/\//i.test(target)) {
    const host = headers.find((header) => header.name.toLowerCase() === "host")?.value;
    if (!host) {
      return {
        draft: null,
        error: "An origin-form request needs a Host header.",
        ignored: [],
        unsupported: [],
      };
    }
    const scheme = /^(localhost|127\.0\.0\.1)(?::|$)/i.test(host) ? "http" : "https";
    const path = target.startsWith("/") ? target : `/${target}`;
    url = `${scheme}://${host}${path}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { draft: null, error: "The request target is not a valid URL.", ignored: [], unsupported: [] };
  }

  const contentType = headers.find((header) => header.name.toLowerCase() === "content-type")?.value ?? "";
  const bodyType = !body ? "none" : contentType.includes("json") ? "json" : contentType.includes("x-www-form-urlencoded") ? "form" : "text";

  return {
    draft: {
      method,
      url: parsed.toString(),
      query: [...parsed.searchParams.entries()].map(([name, value]) => fieldRow(name, value)),
      headers,
      body,
      bodyType,
      allowMetadata: false,
    },
    error: null,
    ignored: [],
    unsupported: [],
  };
}

export function parseRequestText(input: string) {
  const trimmed = input.trim();
  if (/^curl\b/.test(trimmed)) return parseCurl(trimmed);
  if (/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\S+/i.test(trimmed)) return parseHttpMessage(trimmed);
  return {
    draft: null,
    error: "Paste a curl command or a raw HTTP request.",
    ignored: [] as string[],
    unsupported: [] as string[],
  };
}
