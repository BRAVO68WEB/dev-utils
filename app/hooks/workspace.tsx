"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Banner, Button, Loading, fieldClass } from "@/components/ui/chrome";
import { SplitPane } from "@/components/ui/split-pane";
import { initialStates } from "@/lib/defaults";
import { deleteByParent, deleteRecord, putRecord, putSession } from "@/lib/db/index";
import { useDraftRecord } from "@/lib/db/use-draft-record";
import { useRecords } from "@/lib/db/use-records";
import { useSession } from "@/lib/db/use-session";
import { toCurl } from "@/lib/parsers/curl";
import { fieldRow, newId, type HttpDraft, type ToolRecord, type WebhookEventBody, type WebhookInboxBody } from "@/lib/types";

export function HooksWorkspace() {
  const { state, setState, ready, error, dismissError } = useSession("hooks", initialStates.hooks);
  const { rows: inboxes } = useRecords<WebhookInboxBody>("webhook-inbox");
  const active = inboxes.find((row) => row.id === state.activeInboxId) ?? null;
  const origin = useSyncExternalStore(subscribeOrigin, readOrigin, readServerOrigin);

  if (!ready) return <Loading />;

  async function createInbox() {
    const id = newId();
    const now = Date.now();
    const body: WebhookInboxBody = { responseStatus: 200, responseBody: '{"ok":true}', contentType: "application/json" };
    await putRecord({ id, kind: "webhook-inbox", parentId: null, createdAt: now, updatedAt: now, title: "Inbox", body });
    await register(id, body);
    setState({ activeInboxId: id });
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-52 shrink-0 flex-col border-r border-line">
        <div className="border-b border-line p-2">
          <Button type="button" variant="primary" onClick={() => void createInbox()}>
            New inbox
          </Button>
        </div>
        <ul className="min-h-0 flex-1 overflow-auto">
          {inboxes.map((inbox) => (
            <li key={inbox.id}>
              <button
                type="button"
                className={`block w-full truncate px-3 py-2 text-left text-sm hover:bg-surface-2 ${inbox.id === state.activeInboxId ? "bg-surface-2 font-medium" : ""}`}
                onClick={() => setState({ activeInboxId: inbox.id })}
              >
                {inbox.title || "Inbox"}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
        {!active ? (
          <div className="flex h-full flex-col items-start justify-center gap-3 p-8">
            <h2 className="text-base font-semibold">No inbox selected</h2>
            <p className="max-w-md text-sm text-muted">Create an inbox, then send any HTTP request to its URL. Captured requests are stored in this browser.</p>
            <Button type="button" variant="primary" onClick={() => void createInbox()}>
              New inbox
            </Button>
          </div>
        ) : (
          <InboxDetail inbox={active} origin={origin} onDelete={() => setState({ activeInboxId: null })} />
        )}
      </div>
    </div>
  );
}

function InboxDetail({
  inbox,
  origin,
  onDelete,
}: {
  inbox: ToolRecord<WebhookInboxBody>;
  origin: string;
  onDelete: () => void;
}) {
  const draft = useDraftRecord(inbox);
  const { rows: events } = useRecords<WebhookEventBody>("webhook-event", inbox.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = events.find((event) => event.id === selectedId) ?? events[0] ?? null;
  const router = useRouter();
  const listen = `${origin}/in/${inbox.id}`;

  useEffect(() => {
    if (!draft.draft) return;
    void register(inbox.id, draft.draft);
  }, [draft.draft, inbox.id]);

  useEffect(() => {
    let poll = 0;
    const source = new EventSource(`/api/inboxes/${inbox.id}/stream`);
    const take = async (event: WebhookEventBody) => {
      try {
        await putRecord({
          id: event.id,
          kind: "webhook-event",
          parentId: inbox.id,
          createdAt: event.receivedAt,
          updatedAt: event.receivedAt,
          title: `${event.method} ${event.path}`,
          body: event,
        });
        await fetch(`/api/inboxes/${inbox.id}/ack`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids: [event.id] }),
        });
      } catch {
        // Leave the event queued so a later poll can store it.
      }
    };
    source.onmessage = (message) => {
      void take(JSON.parse(message.data) as WebhookEventBody);
    };
    poll = window.setInterval(() => {
      void fetch(`/api/inboxes/${inbox.id}`)
        .then((response) => response.json())
        .then(async (payload: { events?: WebhookEventBody[] }) => {
          for (const event of payload.events ?? []) await take(event);
        })
        .catch(() => {});
    }, 2000);
    return () => {
      source.close();
      window.clearInterval(poll);
    };
  }, [inbox.id]);

  async function openInHttp(event: WebhookEventBody) {
    const params = new URLSearchParams();
    for (const [name, value] of event.query) params.append(name, value);
    const search = params.toString();
    const url = `${origin}/in/${inbox.id}${event.path === "/" ? "" : event.path}${search ? `?${search}` : ""}`;
    const request: HttpDraft = {
      method: event.method,
      url,
      query: event.query.map(([name, value]) => fieldRow(name, value)),
      headers: event.headers
        .filter(([name]) => !["host", "content-length", "connection"].includes(name.toLowerCase()))
        .map(([name, value]) => fieldRow(name, value)),
      body: event.bodyEncoding === "utf8" ? event.body : "",
      bodyType: event.body && event.bodyEncoding === "utf8" ? "text" : "none",
      allowMetadata: false,
    };
    await putSession("http", request);
    router.push("/http");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-2 border-b border-line px-6 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <input className={`${fieldClass} max-w-xs`} aria-label="Inbox name" value={draft.title} onChange={(event) => draft.updateTitle(event.target.value)} />
          <Button type="button" onClick={() => void navigator.clipboard.writeText(listen)}>
            Copy URL
          </Button>
          <Button
            type="button"
            onClick={() => {
              void deleteByParent(inbox.id);
              void fetch(`/api/inboxes/${inbox.id}`, { method: "DELETE" });
            }}
          >
            Clear events
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (!window.confirm("Delete this inbox and its captured requests?")) return;
              void deleteRecord(inbox.id);
              void deleteByParent(inbox.id);
              void fetch(`/api/inboxes/${inbox.id}`, { method: "DELETE" });
              onDelete();
            }}
          >
            Delete inbox
          </Button>
        </div>
        <p className="font-mono text-xs break-all">{listen}</p>
        <p className="text-xs text-muted">A request is kept after this page stores it. Requests that arrive while the page is closed are dropped when the dev server restarts.</p>
        {draft.draft ? (
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm">
              Status
              <input
                className="ml-2 h-8 w-20 rounded-md border border-line bg-surface px-2 font-mono text-sm"
                type="number"
                value={draft.draft.responseStatus}
                onChange={(event) => draft.update({ ...draft.draft!, responseStatus: Number(event.target.value) })}
              />
            </label>
            <label className="text-sm">
              Content type
              <input
                className={`${fieldClass} ml-2 w-48`}
                value={draft.draft.contentType}
                onChange={(event) => draft.update({ ...draft.draft!, contentType: event.target.value })}
              />
            </label>
            <label className="min-w-48 flex-1 text-sm">
              Response body
              <input
                className={`${fieldClass} mt-1`}
                value={draft.draft.responseBody}
                onChange={(event) => draft.update({ ...draft.draft!, responseBody: event.target.value })}
              />
            </label>
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1">
        <SplitPane
          first={
            <ul className="h-full overflow-auto">
              {events.length === 0 ? <li className="px-3 py-3 text-sm text-muted">No requests yet. Point a client at the URL above.</li> : null}
              {events.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    className={`flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2 ${selected?.id === event.id ? "bg-surface-2" : ""}`}
                    onClick={() => setSelectedId(event.id)}
                  >
                    <span className="font-mono">{event.body.method}</span>
                    <span className="truncate font-mono text-xs">{event.body.path}</span>
                    {event.body.truncated ? <span className="text-xs text-warn">truncated</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          }
          second={
            selected ? (
              <EventDetail event={selected.body} onOpen={() => void openInHttp(selected.body)} onCopy={() => void navigator.clipboard.writeText(curlFor(selected.body, listen))} />
            ) : (
              <p className="p-3 text-sm text-muted">Select a request.</p>
            )
          }
        />
      </div>
    </div>
  );
}

function EventDetail({ event, onOpen, onCopy }: { event: WebhookEventBody; onOpen: () => void; onCopy: () => void }) {
  let pretty = event.body;
  if (event.bodyEncoding === "utf8") {
    try {
      pretty = JSON.stringify(JSON.parse(event.body), null, 2);
    } catch {
      pretty = event.body;
    }
  }
  return (
    <div className="h-full overflow-auto p-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-mono text-sm">
          {event.method} {event.path}
        </h2>
        <span className="text-xs text-muted">{new Date(event.receivedAt).toLocaleString()}</span>
        <Button type="button" onClick={onCopy}>
          Copy curl
        </Button>
        <Button type="button" onClick={onOpen}>
          Open in HTTP
        </Button>
      </div>
      {event.query.length > 0 ? (
        <ul className="mt-3 font-mono text-xs">
          {event.query.map(([name, value], index) => (
            <li key={`${name}-${index}`}>
              {name}={value}
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="mt-3 font-mono text-xs">
        {event.headers.map(([name, value], index) => (
          <li key={`${name}-${index}`} className="break-all">
            <span className="text-muted">{name}: </span>
            {value}
          </li>
        ))}
      </ul>
      <pre className="mt-3 overflow-auto rounded-md border border-line bg-surface-2 p-3 font-mono text-[13px] whitespace-pre-wrap">{pretty || "(empty body)"}</pre>
    </div>
  );
}

function curlFor(event: WebhookEventBody, base: string) {
  const params = new URLSearchParams();
  for (const [name, value] of event.query) params.append(name, value);
  const search = params.toString();
  const path = event.path === "/" ? "" : event.path;
  return toCurl({
    method: event.method,
    url: `${base}${path}${search ? `?${search}` : ""}`,
    headers: event.headers.map(([name, value]) => fieldRow(name, value)),
    body: event.bodyEncoding === "utf8" ? event.body : "",
    bodyType: event.body && event.bodyEncoding === "utf8" ? "text" : "none",
  });
}

function subscribeOrigin() {
  return () => {};
}

function readOrigin() {
  return window.location.origin;
}

function readServerOrigin() {
  return "";
}

function register(id: string, body: WebhookInboxBody) {
  return fetch(`/api/inboxes/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: body.responseStatus, body: body.responseBody, contentType: body.contentType }),
  });
}
