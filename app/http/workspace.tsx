"use client";

import { useState } from "react";
import { CodeEditor } from "@/components/editor/code-editor";
import { Banner, Button, Loading, Select, fieldClass } from "@/components/ui/chrome";
import { KeyValueTable } from "@/components/ui/key-value-table";
import { SplitPane } from "@/components/ui/split-pane";
import { initialStates } from "@/lib/defaults";
import { putRecord } from "@/lib/db/index";
import { useRecords } from "@/lib/db/use-records";
import { useSession } from "@/lib/db/use-session";
import { buildTargetUrl } from "@/lib/http/outbound";
import { parseRequestText } from "@/lib/parsers/http-message";
import { toCurl } from "@/lib/parsers/curl";
import { newId, type FieldRow, type HttpBodyType, type HttpDraft, type HttpRecordBody, type HttpResponseView } from "@/lib/types";

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export function HttpWorkspace() {
  const { state, setState, ready, error, dismissError } = useSession("http", initialStates.http);
  const { rows: history } = useRecords<HttpRecordBody>("http");
  const [paste, setPaste] = useState("");
  const [notes, setNotes] = useState<string | null>(null);
  const [response, setResponse] = useState<HttpResponseView | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  if (!ready) return <Loading />;

  let resolved = state.url;
  try {
    resolved = buildTargetUrl(state);
  } catch {
    resolved = state.url;
  }

  function onUrl(url: string) {
    let query = state.query;
    try {
      const parsed = new URL(url);
      const disabled = state.query.filter((row) => !row.enabled);
      query = [
        ...[...parsed.searchParams.entries()].map(([name, value], index) => ({
          id: state.query[index]?.id ?? newId(),
          name,
          value,
          enabled: true,
        })),
        ...disabled,
      ];
    } catch {
      // Keep the previous rows until the URL parses.
    }
    setState({ ...state, url, query });
  }

  function onQuery(query: FieldRow[]) {
    let url = state.url;
    try {
      url = buildTargetUrl({ url: state.url, query });
    } catch {
      // Keep the typed URL until it can host a query string.
    }
    setState({ ...state, query, url });
  }

  function applyPaste() {
    const result = parseRequestText(paste);
    if (!result.draft) {
      setNotes(result.error);
      return;
    }
    setState({ ...result.draft, allowMetadata: state.allowMetadata });
    const parts = [
      result.ignored.length ? `Ignored: ${result.ignored.join(", ")}` : "",
      result.unsupported.length ? `Unsupported: ${result.unsupported.join(", ")}` : "",
    ].filter(Boolean);
    setNotes(parts.join(" ") || null);
  }

  async function send() {
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/http", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(state),
      });
      const payload = (await res.json()) as HttpResponseView & { error?: string };
      const now = Date.now();
      if (!res.ok) {
        const message = payload.error ?? "The request failed.";
        setSendError(message);
        setResponse(null);
        await putRecord<HttpRecordBody>({
          id: newId(),
          kind: "http",
          parentId: null,
          createdAt: now,
          updatedAt: now,
          title: `${state.method} ${state.url}`,
          body: { request: state, response: null, error: message },
        });
        return;
      }
      setResponse(payload);
      await putRecord<HttpRecordBody>({
        id: newId(),
        kind: "http",
        parentId: null,
        createdAt: now,
        updatedAt: now,
        title: `${payload.status} ${state.method} ${state.url}`,
        body: { request: state, response: payload, error: null },
      });
    } catch {
      setSendError("The request did not reach the local proxy.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
      <div className="flex flex-col gap-2 border-b border-line px-3 py-2">
        <textarea
          value={paste}
          onChange={(event) => setPaste(event.target.value)}
          placeholder="Paste a curl command or a raw HTTP request"
          aria-label="Paste curl or HTTP"
          className="h-16 w-full resize-none rounded-md border border-line bg-surface px-2 py-1 font-mono text-sm"
          spellCheck={false}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={applyPaste}>
            Parse
          </Button>
          {notes ? <p className="text-xs text-muted">{notes}</p> : null}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <SplitPane
          first={
            <div className="h-full overflow-auto">
              <div className="flex flex-col gap-3 p-3">
                <div className="flex gap-2">
                  <Select aria-label="Method" value={state.method} onChange={(event) => setState({ ...state, method: event.target.value })}>
                    {methods.map((method) => (
                      <option key={method}>{method}</option>
                    ))}
                  </Select>
                  <input className={fieldClass} aria-label="URL" value={state.url} spellCheck={false} onChange={(event) => onUrl(event.target.value)} />
                </div>
                <p className="font-mono text-xs break-all text-muted">Sends {resolved}</p>
                <section>
                  <h2 className="mb-2 text-lg font-semibold tracking-tight">Query</h2>
                  <KeyValueTable rows={state.query} onChange={onQuery} />
                </section>
                <section>
                  <h2 className="mb-2 text-lg font-semibold tracking-tight">Headers</h2>
                  <KeyValueTable rows={state.headers} onChange={(headers) => setState({ ...state, headers })} />
                </section>
                <section className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight">Body</h2>
                    <Select
                      aria-label="Body type"
                      value={state.bodyType}
                      onChange={(event) => setState({ ...state, bodyType: event.target.value as HttpBodyType })}
                    >
                      <option value="none">None</option>
                      <option value="text">Text</option>
                      <option value="json">JSON</option>
                      <option value="form">Form</option>
                    </Select>
                  </div>
                  {state.bodyType !== "none" ? (
                    <div className="h-40 overflow-hidden rounded-md border border-line">
                      <CodeEditor
                        value={state.body}
                        language={state.bodyType === "json" ? "json" : "plain"}
                        height="160px"
                        onChange={(body) => setState({ ...state, body })}
                      />
                    </div>
                  ) : null}
                </section>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={state.allowMetadata}
                    onChange={(event) => setState({ ...state, allowMetadata: event.target.checked })}
                  />
                  Allow cloud metadata addresses
                </label>
                <div className="flex gap-2">
                  <Button type="button" variant="primary" disabled={sending} onClick={() => void send()}>
                    {sending ? "Sending…" : "Send"}
                  </Button>
                  <Button type="button" onClick={() => void navigator.clipboard.writeText(toCurl(state))}>
                    Copy curl
                  </Button>
                </div>
              </div>
            </div>
          }
          second={
            <div className="flex h-full min-h-0 flex-col">
              <label className="flex items-center gap-2 border-b border-line px-3 py-2 text-sm">
                History
                <Select
                  className="max-w-full flex-1"
                  aria-label="Request history"
                  value=""
                  onChange={(event) => {
                    const record = history.find((row) => row.id === event.target.value);
                    if (!record) return;
                    setState(record.body.request);
                    setResponse(record.body.response);
                    setSendError(record.body.error);
                  }}
                >
                  <option value="">Recent requests</option>
                  {history.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.title}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="min-h-0 flex-1 overflow-auto p-3">
                {sendError ? <p className="text-sm text-err">{sendError}</p> : null}
                {response ? <ResponseView response={response} /> : !sendError ? <p className="text-sm text-muted">The response will show here.</p> : null}
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}

function ResponseView({ response }: { response: HttpResponseView }) {
  const pretty = prettyBody(response);
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-sm">
        <span className={response.status >= 400 ? "text-err" : "text-ok"}>{response.status}</span> {response.statusText} · {response.ms} ms · {response.size} bytes
        {response.truncated ? <span className="text-warn"> · truncated</span> : null}
      </p>
      {response.redirects.length > 0 ? (
        <ol className="font-mono text-xs text-muted">
          {response.redirects.map((hop) => (
            <li key={`${hop.status}-${hop.url}`}>
              {hop.status} {hop.url}
            </li>
          ))}
        </ol>
      ) : null}
      <ul className="font-mono text-xs">
        {response.headers.map(([name, value]) => (
          <li key={`${name}:${value}`} className="break-all">
            <span className="text-muted">{name}: </span>
            {value}
          </li>
        ))}
      </ul>
      <pre className="overflow-auto rounded-md border border-line bg-surface-2 p-3 font-mono text-[13px] whitespace-pre-wrap">{pretty}</pre>
    </div>
  );
}

function prettyBody(response: HttpResponseView) {
  if (response.encoding === "base64") return response.body;
  const type = response.contentType ?? "";
  if (!type.includes("json")) return response.body;
  try {
    return JSON.stringify(JSON.parse(response.body), null, 2);
  } catch {
    return response.body;
  }
}

export type { HttpDraft };
