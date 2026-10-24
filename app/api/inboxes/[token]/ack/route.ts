import { ack } from "@/lib/webhook-buffer";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const body = (await request.json()) as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string") : [];
  ack(token, ids);
  return Response.json({ ok: true });
}
