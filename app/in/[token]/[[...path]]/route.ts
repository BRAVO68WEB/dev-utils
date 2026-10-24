import { NextRequest } from "next/server";
import { STORED_BODY_LIMIT } from "@/lib/limits";
import { describeBody } from "@/lib/text/base64";
import { newId, type WebhookEventBody } from "@/lib/types";
import { enqueue, getMock } from "@/lib/webhook-buffer";

export const dynamic = "force-dynamic";

const TOKEN = /^[A-Za-z0-9-]{8,80}$/;

type IngestContext = { params: Promise<{ token: string; path?: string[] }> };

async function ingest(request: NextRequest, context: IngestContext) {
  const { token, path } = await context.params;
  if (!TOKEN.test(token)) return Response.json({ error: "Unknown inbox." }, { status: 404 });

  const bytes = new Uint8Array(await request.arrayBuffer());
  const truncated = bytes.byteLength > STORED_BODY_LIMIT;
  const kept = truncated ? bytes.subarray(0, STORED_BODY_LIMIT) : bytes;
  const described = describeBody(kept);
  const event: WebhookEventBody = {
    id: newId(),
    method: request.method,
    path: `/${(path ?? []).filter(Boolean).join("/")}`,
    query: [...request.nextUrl.searchParams.entries()],
    headers: [...request.headers.entries()],
    body: described.body,
    bodyEncoding: described.bodyEncoding,
    truncated,
    contentType: request.headers.get("content-type"),
    receivedAt: Date.now(),
  };
  enqueue(token, event);
  const mock = getMock(token);
  const headers = new Headers({
    "access-control-allow-origin": "*",
    "content-type": mock.contentType || "text/plain",
  });
  if (request.method === "HEAD") return new Response(null, { status: mock.status, headers });
  return new Response(mock.body, { status: mock.status, headers });
}

export const GET = ingest;
export const POST = ingest;
export const PUT = ingest;
export const PATCH = ingest;
export const DELETE = ingest;
export const HEAD = ingest;

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
      "access-control-allow-headers": "*",
      "access-control-max-age": "86400",
    },
  });
}
