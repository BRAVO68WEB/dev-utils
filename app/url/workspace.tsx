"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banner, Button, Loading, Select } from "@/components/ui/chrome";
import { initialStates } from "@/lib/defaults";
import { putSession } from "@/lib/db/index";
import { useSession } from "@/lib/db/use-session";
import { parseParams } from "@/lib/text/params";
import { transformUrl } from "@/lib/text/url";

export function UrlWorkspace() {
  const { state, setState, ready, error, dismissError } = useSession("url", initialStates.url);
  const router = useRouter();
  const result = transformUrl(state.input, state.mode, state.variant, state.plusAsSpace && state.mode === "decode");
  const [lastGood, setLastGood] = useState("");
  if (!result.error && lastGood !== result.output) setLastGood(result.output);

  if (!ready) return <Loading />;
  const output = result.error ? lastGood : result.output;

  async function openParams() {
    const candidates = state.mode === "decode" ? [output, state.input] : [state.input, output];
    const url = candidates.find((candidate) => parseParams(candidate).ok);
    if (!url) return;
    await putSession("params", { url });
    router.push("/params");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
      {result.error ? <Banner>{result.error}</Banner> : null}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <Select value={state.mode} aria-label="Mode" onChange={(event) => setState({ ...state, mode: event.target.value as typeof state.mode })}>
          <option value="encode">Encode</option>
          <option value="decode">Decode</option>
        </Select>
        <Select
          value={state.variant}
          aria-label="Variant"
          onChange={(event) => setState({ ...state, variant: event.target.value as typeof state.variant })}
        >
          <option value="component">Component</option>
          <option value="uri">Full URI</option>
        </Select>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.plusAsSpace}
            disabled={state.mode === "encode"}
            onChange={(event) => setState({ ...state, plusAsSpace: event.target.checked })}
          />
          Treat + as space
        </label>
        <Button type="button" onClick={() => void navigator.clipboard.writeText(output)}>
          Copy output
        </Button>
        <Button type="button" onClick={() => void openParams()}>
          Open in param viewer
        </Button>
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-2">
        <label className="flex min-h-0 flex-col border-b border-line">
          <span className="px-3 py-1 text-xs text-muted">Input</span>
          <textarea
            value={state.input}
            onChange={(event) => setState({ ...state, input: event.target.value })}
            className="min-h-0 flex-1 resize-none bg-surface px-3 py-2 font-mono text-sm outline-none"
            spellCheck={false}
          />
        </label>
        <div className="flex min-h-0 flex-col">
          <span className="px-3 py-1 text-xs text-muted">Output</span>
          <pre className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-sm whitespace-pre-wrap">{output}</pre>
        </div>
      </div>
    </div>
  );
}
