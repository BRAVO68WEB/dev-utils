"use client";

import { useState } from "react";
import { Banner, Button, Loading, fieldClass } from "@/components/ui/chrome";
import { initialStates } from "@/lib/defaults";
import { useSession } from "@/lib/db/use-session";
import { parseParams, updateParams, type ParsedParam } from "@/lib/text/params";
import { newId } from "@/lib/types";

type Row = ParsedParam & { id: string };

export function ParamsWorkspace() {
  const { state, setState, ready, error, dismissError } = useSession("params", initialStates.params);
  const parsed = parseParams(state.url);
  const [rows, setRows] = useState<Row[]>([]);
  const [syncedUrl, setSyncedUrl] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  if (ready && parsed.ok && state.url !== syncedUrl) {
    setSyncedUrl(state.url);
    if (writing) setWriting(false);
    else setRows(parsed.rows.map((row) => ({ ...row, id: newId() })));
  }

  if (!ready) return <Loading />;

  function commit(next: Row[], url = state.url) {
    setRows(next);
    if (!parseParams(url).ok) return;
    const nextUrl = updateParams(url, next);
    if (nextUrl === state.url) return;
    setWriting(true);
    setState({ url: nextUrl });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
      {!parsed.ok ? <Banner>{parsed.error}</Banner> : null}
      <div className="border-b border-line p-3">
        <label className="block text-xs text-muted" htmlFor="params-url">
          URL
        </label>
        <input
          id="params-url"
          className={`${fieldClass} mt-1`}
          value={state.url}
          spellCheck={false}
          onChange={(event) => setState({ url: event.target.value })}
        />
        {parsed.ok && parsed.hash ? <p className="mt-2 font-mono text-xs text-muted">Hash {parsed.hash}</p> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <input
                className={fieldClass}
                aria-label="Parameter name"
                value={row.name}
                onChange={(event) => commit(rows.map((item) => (item.id === row.id ? { ...item, name: event.target.value } : item)))}
              />
              <input
                className={fieldClass}
                aria-label="Parameter value"
                value={row.value}
                onChange={(event) => commit(rows.map((item) => (item.id === row.id ? { ...item, value: event.target.value } : item)))}
              />
              <Button type="button" onClick={() => commit(rows.filter((item) => item.id !== row.id))}>
                Remove
              </Button>
            </div>
          ))}
          <div>
            <Button type="button" onClick={() => setRows([...rows, { id: newId(), name: "", value: "" }])}>
              Add parameter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
