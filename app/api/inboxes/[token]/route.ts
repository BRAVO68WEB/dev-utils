import { clearInbox, getMock, listQueue, registerMock } from "@/lib/webhook-buffer";

export const dynamic = "force-dynamic";

type InboxContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: InboxContext) {
  const { token } = await context.params;
  return Response.json({ events: listQueue(token), mock: getMock(token) });
}

export async function PUT(request: Request, context: InboxContext) {
  const { token } = await context.params;
  const body = (await request.json()) as { status?: number; body?: string; contentType?: string };
  registerMock(token, {
    status: Number(body.status),
    body: String(body.body ?? ""),
    contentType: String(body.contentType ?? "application/json"),
  });
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, context: InboxContext) {
  const { token } = await context.params;
  clearInbox(token);
  return Response.json({ ok: true });
}
