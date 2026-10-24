import { executeRequest } from "@/lib/http/execute";
import { buildOutbound } from "@/lib/http/outbound";
import type { FieldRow, HttpBodyType, HttpDraft } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: Partial<HttpDraft>;
  try {
    payload = (await request.json()) as Partial<HttpDraft>;
  } catch {
    return Response.json({ error: "The request body must be JSON." }, { status: 400 });
  }
  if (typeof payload.url !== "string" || typeof payload.method !== "string") {
    return Response.json({ error: "Method and URL are required." }, { status: 400 });
  }
  const body = typeof payload.body === "string" ? payload.body : "";
  if (body.length > 1_000_000) return Response.json({ error: "The request body is larger than 1 MB." }, { status: 400 });

  const draft: HttpDraft = {
    method: payload.method,
    url: payload.url,
    query: rows(payload.query),
    headers: rows(payload.headers),
    body,
    bodyType: bodyType(payload.bodyType),
    allowMetadata: Boolean(payload.allowMetadata),
  };
  const outbound = buildOutbound(draft);
  if (!outbound.ok) return Response.json({ error: outbound.error }, { status: 400 });
  const result = await executeRequest(outbound.request, draft.allowMetadata);
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  return Response.json(result.response);
}

function rows(value: unknown): FieldRow[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Partial<FieldRow>;
    return [
      {
        id: typeof item.id === "string" ? item.id : "row",
        name: typeof item.name === "string" ? item.name : "",
        value: typeof item.value === "string" ? item.value : "",
        enabled: item.enabled !== false,
      },
    ];
  });
}

function bodyType(value: unknown): HttpBodyType {
  if (value === "text" || value === "json" || value === "form" || value === "none") return value;
  return "none";
}
