"use client";

import { useRef, useState, type ReactNode } from "react";
import { CodeEditor } from "@/components/editor/code-editor";
import { Banner, Button, Loading, fieldClass } from "@/components/ui/chrome";
import { SplitPane } from "@/components/ui/split-pane";
import { initialStates } from "@/lib/defaults";
import { useSession } from "@/lib/db/use-session";
import { grepLines } from "@/lib/text/grep";

export function PlaygroundWorkspace() {
  const { state, setState, ready, error, dismissError } = useSession("playground", initialStates.playground);
  if (!ready) return <Loading />;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <Button type="button" variant={state.tab === "jq" ? "primary" : "ghost"} onClick={() => setState({ ...state, tab: "jq" })}>
          jq
        </Button>
        <Button type="button" variant={state.tab === "grep" ? "primary" : "ghost"} onClick={() => setState({ ...state, tab: "grep" })}>
          grep
        </Button>
        <span className="text-xs text-muted">{state.tab === "grep" ? "JavaScript regular expressions" : "jq 1.8 in this browser"}</span>
      </div>
      <div className="min-h-0 flex-1">{state.tab === "jq" ? <JqPane state={state} setState={setState} /> : <GrepPane state={state} setState={setState} />}</div>
    </div>
  );
}

function JqPane({
  state,
  setState,
}: {
  state: typeof initialStates.playground;
  setState: (next: typeof initialStates.playground) => void;
}) {
  const [output, setOutput] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const runId = useRef(0);

  async function run() {
    const id = ++runId.current;
    setRunning(true);
    setProblem(null);
    try {
      const { raw } = await import("jq-wasm");
      const flags = ["-M"];
      if (state.jq.compact) flags.push("-c");
      if (state.jq.raw) flags.push("-r");
      const result = await raw(state.jq.input, state.jq.filter || ".", flags);
      if (id !== runId.current) return;
      setOutput(result.stdout);
      if (result.exitCode !== 0) setProblem(result.stderr || "jq failed.");
    } catch (jqError) {
      if (id !== runId.current) return;
      setOutput("");
      setProblem(jqError instanceof Error ? jqError.message : "jq failed.");
    } finally {
      if (id === runId.current) setRunning(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {problem ? <Banner onDismiss={() => setProblem(null)}>{problem}</Banner> : null}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <input
          className={fieldClass}
          aria-label="jq filter"
          value={state.jq.filter}
          spellCheck={false}
          onChange={(event) => setState({ ...state, jq: { ...state.jq, filter: event.target.value } })}
        />
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.jq.compact}
            onChange={(event) => setState({ ...state, jq: { ...state.jq, compact: event.target.checked } })}
          />
          Compact
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.jq.raw}
            onChange={(event) => setState({ ...state, jq: { ...state.jq, raw: event.target.checked } })}
          />
          Raw
        </label>
        <Button type="button" variant="primary" disabled={running} onClick={() => void run()}>
          {running ? "Running…" : "Run"}
        </Button>
        <span className="text-xs text-muted">⌘Enter</span>
      </div>
      <div className="min-h-0 flex-1">
        <SplitPane
          first={
            <CodeEditor
              value={state.jq.input}
              language="json"
              onChange={(input) => setState({ ...state, jq: { ...state.jq, input } })}
              onModEnter={() => void run()}
            />
          }
          second={<pre className="h-full overflow-auto px-3 py-2 font-mono text-[13px] whitespace-pre-wrap">{output}</pre>}
        />
      </div>
    </div>
  );
}

function GrepPane({
  state,
  setState,
}: {
  state: typeof initialStates.playground;
  setState: (next: typeof initialStates.playground) => void;
}) {
  const result = grepLines(state.grep.text, state.grep);
  const grep = state.grep;

  function patch(next: Partial<typeof grep>) {
    setState({ ...state, grep: { ...grep, ...next } });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {result.error ? <Banner>{result.error}</Banner> : null}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <input className={`${fieldClass} max-w-sm`} aria-label="Pattern" value={grep.pattern} spellCheck={false} onChange={(event) => patch({ pattern: event.target.value })} />
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={grep.literal} onChange={(event) => patch({ literal: event.target.checked })} />
          Literal
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={grep.insensitive} onChange={(event) => patch({ insensitive: event.target.checked })} />
          Ignore case
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={grep.invert} onChange={(event) => patch({ invert: event.target.checked })} />
          Invert
        </label>
        <label className="inline-flex items-center gap-1 text-sm">
          Before
          <input
            className="h-8 w-14 rounded-md border border-line bg-surface px-2 font-mono text-sm"
            type="number"
            min={0}
            max={20}
            value={grep.before}
            onChange={(event) => patch({ before: Number(event.target.value) })}
          />
        </label>
        <label className="inline-flex items-center gap-1 text-sm">
          After
          <input
            className="h-8 w-14 rounded-md border border-line bg-surface px-2 font-mono text-sm"
            type="number"
            min={0}
            max={20}
            value={grep.after}
            onChange={(event) => patch({ after: Number(event.target.value) })}
          />
        </label>
      </div>
      <div className="min-h-0 flex-1">
        <SplitPane
          first={<CodeEditor value={grep.text} language="plain" onChange={(text) => patch({ text })} />}
          second={
            <ol className="h-full overflow-auto font-mono text-[13px]">
              {result.rows.map((row, index) => {
                const previous = result.rows[index - 1];
                const gap = previous && row.line - previous.line > 1;
                return (
                  <li key={row.line}>
                    {gap ? <div className="px-3 py-1 text-muted">…</div> : null}
                    <div className={`flex gap-3 px-3 py-0.5 ${row.match ? "bg-hover" : ""}`}>
                      <span className="w-10 shrink-0 text-right text-muted">{row.line}</span>
                      <span className="whitespace-pre-wrap">
                        <Highlighted text={row.text} ranges={row.ranges} />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          }
        />
      </div>
    </div>
  );
}

function Highlighted({ text, ranges }: { text: string; ranges: [number, number][] }) {
  if (ranges.length === 0) return text;
  const parts: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], index) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={index} className="bg-warn/40 text-inherit">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}
