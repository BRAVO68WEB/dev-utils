import type { HttpDraft } from "@/lib/types";

const METADATA_HOSTS = new Set(["169.254.169.254", "metadata.google.internal"]);
const HOP_HEADERS = new Set(["host", "content-length", "connection", "transfer-encoding", "keep-alive"]);

export type Outbound = {
  url: string;
  method: string;
  headers: [string, string][];
  body: string | null;
};

export function metadataBlocked(url: string, allow: boolean) {
  if (allow) return false;
  try {
    const host = new URL(url).hostname.replace(/^\[|\]$/g, "").toLowerCase();
    return METADATA_HOSTS.has(host);
  } catch {
    return false;
  }
}

export function buildTargetUrl(draft: Pick<HttpDraft, "url" | "query">) {
  const url = new URL(draft.url);
  const params = new URLSearchParams();
  for (const row of draft.query) {
    if (!row.enabled || row.name === "") continue;
    params.append(row.name, row.value);
  }
  url.search = params.toString();
  return url.toString();
}

export function buildOutbound(draft: HttpDraft): { ok: true; request: Outbound } | { ok: false; error: string } {
  let url: string;
  try {
    url = buildTargetUrl(draft);
  } catch {
    return { ok: false, error: "Enter a full URL, including http:// or https://." };
  }
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs can be sent." };
  }
  if (metadataBlocked(url, draft.allowMetadata)) {
    return {
      ok: false,
      error: "That host is a cloud metadata address. Turn on “Allow cloud metadata addresses” to send it.",
    };
  }

  const headers = draft.headers
    .filter((row) => row.enabled && row.name && !HOP_HEADERS.has(row.name.toLowerCase()))
    .map((row) => [row.name, row.value] as [string, string]);
  const method = draft.method.toUpperCase() || "GET";
  const sendsBody = draft.bodyType !== "none" && method !== "GET" && method !== "HEAD";
  if (sendsBody && !headers.some(([name]) => name.toLowerCase() === "content-type")) {
    if (draft.bodyType === "json") headers.push(["Content-Type", "application/json"]);
    if (draft.bodyType === "form") headers.push(["Content-Type", "application/x-www-form-urlencoded"]);
  }
  return {
    ok: true,
    request: { url, method, headers, body: sendsBody ? draft.body : null },
  };
}

export function nextHop(status: number, location: string | null, currentUrl: string, method: string, body: string | null) {
  if (!location || ![301, 302, 303, 307, 308].includes(status)) return null;
  const url = new URL(location, currentUrl).toString();
  if (status === 301 || status === 302 || status === 303) return { url, method: "GET", body: null as string | null };
  return { url, method, body };
}
