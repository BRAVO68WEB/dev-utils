"use client";

import { Banner, Button, Loading, fieldClass } from "@/components/ui/chrome";
import { initialStates } from "@/lib/defaults";
import { useSession } from "@/lib/db/use-session";
import { randomProblem, randomStrings } from "@/lib/random/strings";

const sets = [
  ["lower", "Lowercase"],
  ["upper", "Uppercase"],
  ["numbers", "Numbers"],
  ["special", "Special characters"],
] as const;

export function RandomWorkspace() {
  const { state, setState, ready, error, dismissError } = useSession("random", initialStates.random);
  if (!ready) return <Loading />;
  const problem = randomProblem(state);

  function generate() {
    const result = randomStrings(state);
    setState({ ...state, output: result.error ? "" : result.values.join("\n") });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {error ? <Banner onDismiss={dismissError}>{error}</Banner> : null}
      <div className="flex flex-wrap items-end gap-3 border-b border-line px-3 py-2">
        <label className="text-sm">
          Length
          <input className={`${fieldClass} mt-1 w-24`} aria-label="Length" type="number" min={1} max={2048} value={state.length} onChange={(event) => setState({ ...state, length: Number(event.target.value) })} />
        </label>
        <label className="text-sm">
          How many
          <input className={`${fieldClass} mt-1 w-24`} aria-label="How many" type="number" min={1} max={200} value={state.count} onChange={(event) => setState({ ...state, count: Number(event.target.value) })} />
        </label>
        {sets.map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 pb-1 text-sm">
            <input type="checkbox" checked={state[key]} onChange={(event) => setState({ ...state, [key]: event.target.checked })} />
            {label}
          </label>
        ))}
        <Button type="button" variant="primary" onClick={generate}>
          Generate
        </Button>
        <Button type="button" disabled={!state.output} onClick={() => void navigator.clipboard.writeText(state.output)}>
          Copy
        </Button>
      </div>
      {problem ? <Banner>{problem}</Banner> : null}
      <textarea className="min-h-0 flex-1 resize-none bg-surface p-3 font-mono text-[13px] text-ink outline-none" aria-label="Generated strings" readOnly value={state.output} />
    </div>
  );
}
