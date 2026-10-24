"use client";

import { useEffect, useRef, useState } from "react";
import { CodeEditor } from "@/components/editor/code-editor";
import { Banner, Button, Loading } from "@/components/ui/chrome";
import { SplitPane } from "@/components/ui/split-pane";
import { initialStates } from "@/lib/defaults";
import { useSession } from "@/lib/db/use-session";
import { sandboxDocument } from "@/lib/sandbox/document";

type LogLine = { level: string; text: string };

export function SandboxWorkspace() {
  const { state, setState, ready, error, dismissError } = useSession("sandbox", initialStates.sandbox);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      setLogs((current) => [...current, { level: "error", text: "Stopped after 5 seconds." }]);
      setRunning(false);
      setRunId((value) => value + 1);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [running, runId]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { type?: string; level?: string; args?: string[]; value?: string };
      if (data?.type === "log") setLogs((current) => [...current, { level: data.level ?? "log", text: (data.args ?? []).join(" ") }]);
      if (data?.type === "result") setResult(data.value ?? "");
      if (data?.type === "done") setRunning(false);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!ready) return <Loading />;

  function run() {
    setLogs([]);
    setResult(null);
    setRunning(true);
    setRunId((value) => value + 1);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <Button type="button" variant="primary" onClick={run}>
          Run
        </Button>
        <p className="text-sm text-muted">Runs in a separate frame. It cannot read saved tools. It can still use the network.</p>
      </div>
      <iframe
        key={runId}
        ref={frameRef}
        title="JavaScript sandbox"
        sandbox="allow-scripts"
        srcDoc={sandboxDocument}
        className="hidden"
        onLoad={() => {
          if (!running) return;
          frameRef.current?.contentWindow?.postMessage({ type: "run", code: state.source }, "*");
        }}
      />
      <div className="min-h-0 flex-1">
        <SplitPane
          first={<CodeEditor value={state.source} language="javascript" onChange={(source) => setState({ source })} onModEnter={run} />}
          second={
            <div className="h-full overflow-auto p-3 font-mono text-[13px]">
              {logs.length === 0 && result == null ? <p className="text-muted">Output appears here.</p> : null}
              <ul>
                {logs.map((line, index) => (
                  <li key={`${index}-${line.text}`} className={line.level === "error" ? "text-err" : line.level === "warn" ? "text-warn" : "text-ink"}>
                    {line.text}
                  </li>
                ))}
              </ul>
              {result != null ? <p className="mt-3 text-ok">Result {result}</p> : null}
            </div>
          }
        />
      </div>
    </div>
  );
}
