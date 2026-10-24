"use client";

import { useMemo, useState } from "react";
import { CodeEditor } from "@/components/editor/code-editor";
import { Banner, Loading } from "@/components/ui/chrome";
import { SplitPane } from "@/components/ui/split-pane";
import { initialStates } from "@/lib/defaults";
import { useSession } from "@/lib/db/use-session";
import { inspectYaml } from "@/lib/text/yaml";

export function YamlWorkspace() {
  const { state, setState, ready, error, dismissError } = useSession("yaml", initialStates.yaml);
  const [caret, setCaret] = useState<{ from: number; to: number; nonce: number } | null>(null);
  const report = useMemo(() => inspectYaml(state.source), [state.source]);
  if (!ready) return <Loading />;
  const errors = report.problems.filter((problem) => problem.severity === "error");
  const tone = errors.length > 0 ? "error" : report.problems.length > 0 ? "warn" : "ok";
  const summary =
    !state.source.trim()
      ? "Paste YAML to validate it."
      : errors.length > 0
        ? `${errors.length} error${errors.length === 1 ? "" : "s"}`
        : report.problems.length > 0
          ? "Valid, with warnings"
          : "Valid YAML";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
      <Banner tone={tone}>{summary}</Banner>
      <div className="min-h-0 flex-1">
        <SplitPane
          first={<CodeEditor value={state.source} language="yaml" caret={caret} onChange={(source) => setState({ source })} />}
          second={
            <div className="flex h-full min-h-0 flex-col">
              <ul className="max-h-48 overflow-auto border-b border-line">
                {report.problems.length === 0 ? <li className="px-3 py-2 text-sm text-muted">No problems.</li> : null}
                {report.problems.map((problem, index) => (
                  <li key={`${problem.from}-${index}`}>
                    <button
                      type="button"
                      className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2"
                      onClick={() => setCaret({ from: problem.from, to: problem.to, nonce: Date.now() })}
                    >
                      <span className={problem.severity === "error" ? "text-err" : "text-warn"}>{problem.severity}</span>
                      <span className="font-mono text-xs text-muted">
                        {problem.line}:{problem.column}
                      </span>
                      <span>{problem.message}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="min-h-0 flex-1">
                <CodeEditor value={report.json ?? ""} language="json" readOnly />
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
