import { encodeUtf8 } from "@/lib/text/base64";
import { fieldRow, type HttpDraft } from "@/lib/types";

export type ParseResult = {
  draft: HttpDraft | null;
  error: string | null;
  ignored: string[];
  unsupported: string[];
};

const IGNORED = new Set([
  "-k",
  "--insecure",
  "-s",
  "--silent",
  "-S",
  "--show-error",
  "-L",
  "--location",
  "-i",
  "--include",
  "-v",
  "--verbose",
  "--compressed",
  "-N",
  "--no-buffer",
  "-f",
  "--fail",
  "--http1.1",
  "--http2",
]);

const CONSUMES_UNSUPPORTED = new Set([
  "--retry",
  "--retry-delay",
  "--retry-max-time",
  "--connect-timeout",
  "--max-time",
  "-m",
  "--output",
  "-o",
  "--cookie",
  "-b",
  "--cookie-jar",
  "-c",
  "--referer",
  "-e",
  "--proxy",
  "-x",
  "--config",
  "-K",
  "--form",
  "-F",
  "--data-urlencode",
  "--trace",
  "--trace-ascii",
  "--libcurl",
  "--key",
  "--cert",
  "--cacert",
]);

export function tokenize(input: string) {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let escape = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index] ?? "";
    if (escape) {
      current += char;
      escape = false;
      continue;
    }
    if (quote === null && char === "\\" && input[index + 1] === "\n") {
      index += 1;
      continue;
    }
    if (char === "\\" && quote !== "'") {
      escape = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) tokens.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current) tokens.push(current);
  return tokens;
}

export function parseCurl(input: string): ParseResult {
  const tokens = tokenize(input.trim());
  if (tokens[0] !== "curl") {
    return { draft: null, error: "Paste a command that starts with curl.", ignored: [], unsupported: [] };
  }

  let method = "";
  let url = "";
  let head = false;
  let get = false;
  const headers: HttpDraft["headers"] = [];
  const data: string[] = [];
  const json: string[] = [];
  const ignored: string[] = [];
  const unsupported: string[] = [];

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index] ?? "";
    if (token === "-G" || token === "--get") {
      get = true;
      continue;
    }
    if (token === "-I" || token === "--head") {
      head = true;
      continue;
    }
    if (IGNORED.has(token)) {
      ignored.push(token);
      continue;
    }

    const inline = splitInline(token);
    const flag = inline.flag;
    const take = () => {
      if (inline.value != null) return inline.value;
      index += 1;
      return tokens[index] ?? "";
    };

    if (flag === "-X" || flag === "--request") {
      method = take();
      continue;
    }
    if (flag === "-H" || flag === "--header") {
      const header = splitHeader(take());
      if (header) headers.push(fieldRow(header.name, header.value));
      continue;
    }
    if (flag === "-d" || flag === "--data" || flag === "--data-raw" || flag === "--data-binary" || flag === "--data-ascii") {
      const value = take();
      if (value.startsWith("@")) unsupported.push(`${flag} file`);
      else data.push(value);
      continue;
    }
    if (flag === "--json") {
      json.push(take());
      continue;
    }
    if (flag === "--url") {
      url = take();
      continue;
    }
    if (flag === "-u" || flag === "--user") {
      headers.push(fieldRow("Authorization", `Basic ${encodeUtf8(take(), false)}`));
      continue;
    }
    if (flag === "-A" || flag === "--user-agent") {
      headers.push(fieldRow("User-Agent", take()));
      continue;
    }
    if (CONSUMES_UNSUPPORTED.has(flag) || CONSUMES_UNSUPPORTED.has(token)) {
      unsupported.push(flag);
      take();
      continue;
    }
    if (token.startsWith("-")) {
      unsupported.push(token);
      continue;
    }
    if (!url) url = token;
    else unsupported.push(token);
  }

  if (!url) return { draft: null, error: "The curl command does not include a URL.", ignored, unsupported };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { draft: null, error: "The URL in that curl command could not be parsed.", ignored, unsupported };
  }

  if (get && data.length > 0) {
    const extra = new URLSearchParams(data.join("&"));
    for (const [name, value] of extra) parsed.searchParams.append(name, value);
    data.length = 0;
  }

  const contentType = headers.find((header) => header.name.toLowerCase() === "content-type")?.value ?? "";
  let body = "";
  let bodyType: HttpDraft["bodyType"] = "none";
  if (json.length > 0) {
    body = json.join("\n");
    bodyType = "json";
    if (!contentType) headers.push(fieldRow("Content-Type", "application/json"));
  } else if (data.length > 0) {
    body = data.join("&");
    bodyType = contentType.includes("json") ? "json" : "form";
  }

  if (!method) {
    if (head) method = "HEAD";
    else if (body && !get) method = "POST";
    else method = "GET";
  }

  return {
    draft: {
      method: method.toUpperCase(),
      url: parsed.toString(),
      query: [...parsed.searchParams.entries()].map(([name, value]) => fieldRow(name, value)),
      headers,
      body,
      bodyType,
      allowMetadata: false,
    },
    error: null,
    ignored,
    unsupported,
  };
}

function splitInline(token: string) {
  if (token.startsWith("--")) {
    const eq = token.indexOf("=");
    if (eq !== -1) return { flag: token.slice(0, eq), value: token.slice(eq + 1) };
    return { flag: token, value: null as string | null };
  }
  if (token.startsWith("-") && token.length > 2) {
    const flag = token.slice(0, 2);
    if (["-X", "-H", "-d", "-u", "-A", "-m", "-o", "-b", "-c", "-e", "-x", "-K", "-F"].includes(flag)) {
      return { flag, value: token.slice(2) };
    }
  }
  return { flag: token, value: null as string | null };
}

function splitHeader(value: string) {
  const index = value.indexOf(":");
  if (index === -1) return null;
  return { name: value.slice(0, index).trim(), value: value.slice(index + 1).trim() };
}

export function shellQuote(value: string) {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

export function toCurl(draft: Pick<HttpDraft, "method" | "url" | "headers" | "body" | "bodyType">) {
  const parts = [`curl -X ${draft.method} ${shellQuote(draft.url)}`];
  for (const header of draft.headers) {
    if (!header.enabled || !header.name) continue;
    parts.push(`-H ${shellQuote(`${header.name}: ${header.value}`)}`);
  }
  if (draft.body && draft.bodyType !== "none") {
    const flag = draft.bodyType === "json" ? "--json" : "--data-raw";
    parts.push(`${flag} ${shellQuote(draft.body)}`);
  }
  return parts.join(" \\\n  ");
}
