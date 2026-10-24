"use client";

import { Banner, Button, Loading } from "@/components/ui/chrome";
import { initialStates } from "@/lib/defaults";
import { useSession } from "@/lib/db/use-session";
import { decodeBase64, encodeBytes, encodeUtf8 } from "@/lib/text/base64";

export function Base64Workspace() {
  const { state, setState, ready, error, dismissError } = useSession("base64", initialStates.base64);
  if (!ready) return <Loading />;
  const result =
    state.direction === "encode"
      ? { text: encodeUtf8(state.text, state.urlSafe), error: null as string | null }
      : decodeBase64(state.text, state.urlSafe);

  async function onFile(file: File) {
    const encoded = encodeBytes(new Uint8Array(await file.arrayBuffer()), state.urlSafe);
    setState({ ...state, text: encoded, direction: "decode" });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
      {result.error ? <Banner>{result.error}</Banner> : null}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <Button type="button" variant={state.direction === "encode" ? "primary" : "ghost"} onClick={() => setState({ ...state, direction: "encode" })}>
          Encode
        </Button>
        <Button type="button" variant={state.direction === "decode" ? "primary" : "ghost"} onClick={() => setState({ ...state, direction: "decode" })}>
          Decode
        </Button>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={state.urlSafe} onChange={(event) => setState({ ...state, urlSafe: event.target.checked })} />
          URL-safe
        </label>
        <label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-line bg-surface px-2.5 text-sm hover:bg-surface-2">
          Drop or choose a file
          <input
            type="file"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
              event.target.value = "";
            }}
          />
        </label>
        <Button type="button" onClick={() => void navigator.clipboard.writeText(result.text)}>
          Copy output
        </Button>
      </div>
      <div
        className="grid min-h-0 flex-1 grid-rows-2"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (file) void onFile(file);
        }}
      >
        <label className="flex min-h-0 flex-col border-b border-line">
          <span className="px-3 py-1 text-xs text-muted">Input</span>
          <textarea
            value={state.text}
            onChange={(event) => setState({ ...state, text: event.target.value })}
            className="min-h-0 flex-1 resize-none bg-surface px-3 py-2 font-mono text-sm outline-none"
            spellCheck={false}
          />
        </label>
        <div className="flex min-h-0 flex-col">
          <span className="px-3 py-1 text-xs text-muted">Output</span>
          <pre className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-sm break-all whitespace-pre-wrap">{result.text}</pre>
        </div>
      </div>
    </div>
  );
}
