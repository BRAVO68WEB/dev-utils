import { describeBody } from "@/lib/text/base64";
import { metadataBlocked, nextHop, type Outbound } from "@/lib/http/outbound";
import { PROXY_TIMEOUT_MS, STORED_BODY_LIMIT } from "@/lib/limits";
import type { HttpResponseView } from "@/lib/types";

export type ProxyResult = { ok: true; response: HttpResponseView } | { ok: false; error: string; status: number };

export async function executeRequest(request: Outbound, allowMetadata: boolean, fetchImpl: typeof fetch = fetch): Promise<ProxyResult> {
  const redirects: { url: string; status: number }[] = [];
  let current = request;
  const started = Date.now();
  const signal = AbortSignal.timeout(PROXY_TIMEOUT_MS);

  try {
    for (let hop = 0; hop < 6; hop += 1) {
      if (metadataBlocked(current.url, allowMetadata)) {
        return { ok: false, status: 400, error: "A redirect pointed at a cloud metadata address." };
      }
      const response = await fetchImpl(current.url, {
        method: current.method,
        headers: current.headers,
        body: current.body,
        redirect: "manual",
        signal,
      });
      const location = response.headers.get("location");
      const follow = nextHop(response.status, location, current.url, current.method, current.body);
      if (follow && hop < 5) {
        redirects.push({ url: current.url, status: response.status });
        await response.body?.cancel();
        current = { ...current, url: follow.url, method: follow.method, body: follow.body };
        continue;
      }

      const { bytes, truncated } = await readLimited(response, STORED_BODY_LIMIT);
      const described = describeBody(bytes);
      const contentLength = response.headers.get("content-length");
      return {
        ok: true,
        response: {
          status: response.status,
          statusText: response.statusText,
          ms: Date.now() - started,
          size: contentLength ? Number(contentLength) : bytes.byteLength,
          headers: collectHeaders(response.headers),
          body: described.body,
          truncated,
          contentType: response.headers.get("content-type"),
          encoding: described.bodyEncoding,
          redirects,
        },
      };
    }
    return { ok: false, status: 502, error: "The request followed more than five redirects." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The request failed.";
    return { ok: false, status: 502, error: message };
  }
}

function collectHeaders(headers: Headers) {
  const pairs: [string, string][] = [];
  headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    pairs.push([key, value]);
  });
  const setCookie = "getSetCookie" in headers ? headers.getSetCookie() : [];
  for (const cookie of setCookie) pairs.push(["set-cookie", cookie]);
  return pairs;
}

async function readLimited(response: Response, limit: number) {
  const reader = response.body?.getReader();
  if (!reader) return { bytes: new Uint8Array(), truncated: false };
  const chunks: Uint8Array[] = [];
  let size = 0;
  let truncated = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    if (size + value.byteLength > limit) {
      chunks.push(value.subarray(0, limit - size));
      size = limit;
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
    size += value.byteLength;
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { bytes, truncated };
}
