export const STORED_BODY_LIMIT = 256 * 1024;
export const WEBHOOK_EVENT_CAP = 200;
export const WEBHOOK_QUEUE_CAP = 100;
export const HTTP_HISTORY_CAP = 50;
export const PROXY_TIMEOUT_MS = 30_000;

export function capText(text: string, limit = STORED_BODY_LIMIT) {
  if (text.length <= limit) return { text, truncated: false };
  return { text: text.slice(0, limit), truncated: true };
}
