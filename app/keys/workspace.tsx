"use client";

import { useState } from "react";
import { Banner, Button, Loading, Select } from "@/components/ui/chrome";
import { SplitPane } from "@/components/ui/split-pane";
import { initialStates } from "@/lib/defaults";
import { useSession } from "@/lib/db/use-session";
import { generateKeypair, keyAlgs } from "@/lib/keys/generate";
import type { KeyAlg } from "@/lib/types";

export function KeysWorkspace() {
  const { state, setState, ready, error, dismissError } = useSession("keys", initialStates.keys);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  if (!ready) return <Loading />;

  async function generate() {
    setBusy(true);
    setProblem(null);
    try {
      const pair = await generateKeypair(state.alg);
      setState({ ...state, ...pair });
    } catch (generateError) {
      setProblem(generateError instanceof Error ? generateError.message : "Could not generate a keypair.");
    } finally {
      setBusy(false);
    }
  }

  async function copy(value: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
      {problem ? <Banner>{problem}</Banner> : null}
      <Banner tone="warn">The private key is saved in this browser with this tool.</Banner>
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <label className="flex items-center gap-2 text-sm">
          Algorithm
          <Select aria-label="Key algorithm" value={state.alg} onChange={(event) => setState({ ...state, alg: event.target.value as KeyAlg })}>
            {keyAlgs.map((alg) => (
              <option key={alg}>{alg}</option>
            ))}
          </Select>
        </label>
        <Button type="button" variant="primary" disabled={busy} onClick={() => void generate()}>
          {busy ? "Generating…" : "Generate"}
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <SplitPane
          first={<KeyPane title="Public" pem={state.publicPem} jwk={state.publicJwk} onCopy={copy} />}
          second={<KeyPane title="Private" pem={state.privatePem} jwk={state.privateJwk} onCopy={copy} />}
        />
      </div>
    </div>
  );
}

function KeyPane({ title, pem, jwk, onCopy }: { title: string; pem: string; jwk: string; onCopy: (value: string) => Promise<void> }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-auto p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <Button type="button" disabled={!pem} onClick={() => void onCopy(pem)}>
          Copy PEM
        </Button>
      </div>
      <pre className="overflow-auto rounded-md border border-line bg-surface p-3 font-mono text-[13px] whitespace-pre-wrap">{pem || "Generate a keypair."}</pre>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">{title} JWK</h2>
        <Button type="button" disabled={!jwk} onClick={() => void onCopy(jwk)}>
          Copy JWK
        </Button>
      </div>
      <pre className="overflow-auto rounded-md border border-line bg-surface p-3 font-mono text-[13px] whitespace-pre-wrap">{jwk || "No JWK yet."}</pre>
    </div>
  );
}
