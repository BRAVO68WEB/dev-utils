import { listQueue, subscribe } from "@/lib/webhook-buffer";
import type { WebhookEventBody } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const encoder = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: WebhookEventBody) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      for (const event of listQueue(token)) send(event);
      const unsubscribe = subscribe(token, send);
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(ping);
        }
      }, 15000);
      cleanup = () => {
        clearInterval(ping);
        unsubscribe();
      };
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
