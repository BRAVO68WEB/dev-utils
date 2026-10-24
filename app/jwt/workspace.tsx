"use client";

import { useState } from "react";
import { CodeEditor } from "@/components/editor/code-editor";
import { Banner, Button, Loading, Select, fieldClass } from "@/components/ui/chrome";
import { SplitPane } from "@/components/ui/split-pane";
import { initialStates } from "@/lib/defaults";
import { useSession } from "@/lib/db/use-session";
import { claimTimes, decodeJwt, isHmacAlg, signJwt, verifyJwt, hmacAlgs } from "@/lib/jwt/token";
import type { JwtAlg } from "@/lib/types";

export function JwtWorkspace() {
  const { state, setState, ready, error, dismissError } = useSession("jwt", initialStates.jwt);
  const [seenToken, setSeenToken] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const decoded = decodeJwt(state.token);
  if (ready && state.token !== seenToken) {
    setSeenToken(state.token);
    if (decoded.ok) {
      setState({
        ...state,
        header: decoded.headerText,
        payload: decoded.payloadText,
        alg: isHmacAlg(decoded.alg) ? decoded.alg : state.alg,
      });
    }
  }
  if (!ready) return <Loading />;
  const times = claimTimes(state.payload);

  async function sign() {
    setBusy(true);
    setNotice(null);
    try {
      const signed = await signJwt(state.header, state.payload, state.secret, state.alg);
      setSeenToken(signed.token);
      setState({ ...state, token: signed.token, header: signed.headerText, payload: signed.payloadText });
      setNotice("Signed a new token with the edited header and payload.");
    } catch (signError) {
      setNotice(signError instanceof Error ? signError.message : "Could not sign the token.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    try {
      if (!isHmacAlg(decoded.alg)) {
        setNotice(`This token says ${decoded.alg ?? "it has no algorithm"}. HMAC verification covers HS256, HS384, and HS512.`);
        return;
      }
      const matches = await verifyJwt(state.token, state.secret, decoded.alg);
      setNotice(matches ? "The signature matches this secret." : "The signature does not match this secret.");
    } catch (verifyError) {
      setNotice(verifyError instanceof Error ? verifyError.message : "Could not verify the token.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
      {decoded.error ? <Banner>{decoded.error}</Banner> : null}
      {notice ? <Banner tone={notice.includes("does not") || notice.includes("Could") || notice.includes("must") ? "error" : "ok"}>{notice}</Banner> : null}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <label className="flex items-center gap-2 text-sm">
          Algorithm
          <Select aria-label="Algorithm" value={state.alg} onChange={(event) => setState({ ...state, alg: event.target.value as JwtAlg })}>
            {hmacAlgs.map((alg) => (
              <option key={alg}>{alg}</option>
            ))}
          </Select>
        </label>
        <input className={`${fieldClass} max-w-sm`} aria-label="HMAC secret" placeholder="HMAC secret" value={state.secret} spellCheck={false} onChange={(event) => setState({ ...state, secret: event.target.value })} />
        <Button type="button" variant="primary" disabled={busy} onClick={() => void sign()}>
          Sign edits
        </Button>
        <Button type="button" disabled={busy} onClick={() => void verify()}>
          Verify
        </Button>
        {times.map((claim) => (
          <span key={claim.label} className="font-mono text-xs text-muted">
            {claim.label} {claim.value}
          </span>
        ))}
      </div>
      <label className="border-b border-line px-3 py-2 text-sm">
        Token
        <textarea className={`${fieldClass} mt-1 h-20 w-full py-1`} aria-label="JWT" value={state.token} spellCheck={false} onChange={(event) => setState({ ...state, token: event.target.value })} />
      </label>
      <div className="min-h-0 flex-1">
        <SplitPane
          first={
            <div className="flex h-full min-h-0 flex-col">
              <p className="border-b border-line px-3 py-2 text-sm font-semibold">Header</p>
              <div className="min-h-0 flex-1">
                <CodeEditor value={state.header} language="json" onChange={(header) => setState({ ...state, header })} />
              </div>
            </div>
          }
          second={
            <div className="flex h-full min-h-0 flex-col">
              <p className="border-b border-line px-3 py-2 text-sm font-semibold">Payload</p>
              <div className="min-h-0 flex-1">
                <CodeEditor value={state.payload} language="json" onChange={(payload) => setState({ ...state, payload })} />
              </div>
            </div>
          }
        />
      </div>
      {decoded.ok ? <p className="truncate border-t border-line px-3 py-2 font-mono text-xs text-muted">Signature {decoded.signature}</p> : null}
    </div>
  );
}
