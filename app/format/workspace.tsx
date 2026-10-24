"use client";

import { useState } from "react";
import { CodeEditor } from "@/components/editor/code-editor";
import { Banner, Button, Loading, Select } from "@/components/ui/chrome";
import { initialStates } from "@/lib/defaults";
import { useSession } from "@/lib/db/use-session";
import { formatSource } from "@/lib/format/prettier";
import type { FormatParser } from "@/lib/types";

const parsers: { id: FormatParser; label: string; language: string }[] = [
  { id: "babel", label: "JavaScript", language: "javascript" },
  { id: "typescript", label: "TypeScript", language: "typescript" },
  { id: "json", label: "JSON", language: "json" },
  { id: "css", label: "CSS", language: "css" },
  { id: "scss", label: "SCSS", language: "css" },
  { id: "html", label: "HTML", language: "html" },
  { id: "markdown", label: "Markdown", language: "markdown" },
  { id: "yaml", label: "YAML", language: "yaml" },
];

export function FormatWorkspace() {
  const { state, setState, ready, error, dismissError } = useSession("format", initialStates.format);
  const [problem, setProblem] = useState<string | null>(null);
  const [formatting, setFormatting] = useState(false);
  if (!ready) return <Loading />;
  const language = parsers.find((parser) => parser.id === state.parser)?.language ?? "plain";

  async function format() {
    setFormatting(true);
    try {
      const source = await formatSource(state.source, state.parser);
      setState({ ...state, source });
      setProblem(null);
    } catch (formatError) {
      setProblem(formatError instanceof Error ? formatError.message : "Could not format that text.");
    } finally {
      setFormatting(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
      {problem ? <Banner onDismiss={() => setProblem(null)}>{problem}</Banner> : null}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <Select
          value={state.parser}
          aria-label="Parser"
          onChange={(event) => setState({ ...state, parser: event.target.value as FormatParser })}
        >
          {parsers.map((parser) => (
            <option key={parser.id} value={parser.id}>
              {parser.label}
            </option>
          ))}
        </Select>
        <Button type="button" variant="primary" disabled={formatting} onClick={() => void format()}>
          {formatting ? "Formatting…" : "Format"}
        </Button>
        <span className="text-xs text-muted">⌘Enter</span>
      </div>
      <div className="min-h-0 flex-1">
        <CodeEditor
          value={state.source}
          language={language}
          onChange={(source) => setState({ ...state, source })}
          onModEnter={() => void format()}
        />
      </div>
    </div>
  );
}
