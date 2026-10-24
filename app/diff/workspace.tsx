"use client";

import { MergeEditor } from "@/components/editor/merge-editor";
import { Banner, Button, Loading, Select } from "@/components/ui/chrome";
import { initialStates } from "@/lib/defaults";
import { useSession } from "@/lib/db/use-session";
import { summarizeDiff } from "@/lib/text/diff";
import type { DiffLanguage } from "@/lib/types";

const languages: { id: DiffLanguage; label: string }[] = [
  { id: "plain", label: "Plain" },
  { id: "json", label: "JSON" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "css", label: "CSS" },
  { id: "html", label: "HTML" },
  { id: "markdown", label: "Markdown" },
  { id: "yaml", label: "YAML" },
];

export function DiffWorkspace() {
  const { state, setState, ready, error, dismissError } = useSession("diff", initialStates.diff);
  if (!ready) return <Loading />;
  const stats = summarizeDiff(state.left, state.right, state.ignoreWhitespace);

  function load(side: "left" | "right", file: File) {
    void file.text().then((text) => setState({ ...state, [side]: text }));
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <Button type="button" variant={state.view === "split" ? "primary" : "ghost"} onClick={() => setState({ ...state, view: "split" })}>
          Split
        </Button>
        <Button type="button" variant={state.view === "unified" ? "primary" : "ghost"} onClick={() => setState({ ...state, view: "unified" })}>
          Unified
        </Button>
        <Select
          value={state.language}
          aria-label="Language"
          onChange={(event) => setState({ ...state, language: event.target.value as DiffLanguage })}
        >
          {languages.map((language) => (
            <option key={language.id} value={language.id}>
              {language.label}
            </option>
          ))}
        </Select>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={state.ignoreWhitespace}
            onChange={(event) => setState({ ...state, ignoreWhitespace: event.target.checked })}
          />
          Ignore whitespace
        </label>
        <span className="font-mono text-sm text-ok">+{stats.added}</span>
        <span className="font-mono text-sm text-err">-{stats.removed}</span>
        <Button type="button" onClick={() => setState({ ...state, left: state.right, right: state.left })}>
          Swap
        </Button>
        <FileButton label="Load original" onFile={(file) => load("left", file)} />
        <FileButton label="Load modified" onFile={(file) => load("right", file)} />
      </div>
      <div className="min-h-0 flex-1">
        <MergeEditor
          left={state.left}
          right={state.right}
          language={state.language}
          ignoreWhitespace={state.ignoreWhitespace}
          view={state.view}
          onChange={(next) => setState({ ...state, ...next })}
        />
      </div>
    </div>
  );
}

function FileButton({ label, onFile }: { label: string; onFile: (file: File) => void }) {
  return (
    <label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-line bg-surface px-2.5 text-sm hover:bg-surface-2">
      {label}
      <input
        type="file"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
    </label>
  );
}
