export type GrepOptions = {
  pattern: string;
  literal: boolean;
  insensitive: boolean;
  invert: boolean;
  before: number;
  after: number;
};

export type GrepRow = {
  line: number;
  text: string;
  match: boolean;
  ranges: [number, number][];
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function grepLines(text: string, options: GrepOptions): { rows: GrepRow[]; error: string | null } {
  if (!options.pattern) return { rows: [], error: "Enter a pattern." };
  let expression: RegExp;
  try {
    const source = options.literal ? escapeRegExp(options.pattern) : options.pattern;
    expression = new RegExp(source, options.insensitive ? "gi" : "g");
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : "Invalid regular expression." };
  }

  const lines = text.split(/\n/);
  const matched = new Set<number>();
  for (let index = 0; index < lines.length; index += 1) {
    expression.lastIndex = 0;
    const hit = expression.test(lines[index] ?? "");
    if (options.invert ? !hit : hit) matched.add(index);
  }

  const before = clamp(options.before);
  const after = clamp(options.after);
  const shown = new Set<number>();
  for (const index of matched) {
    shown.add(index);
    for (let cursor = 1; cursor <= before; cursor += 1) if (index - cursor >= 0) shown.add(index - cursor);
    for (let cursor = 1; cursor <= after; cursor += 1) if (index + cursor < lines.length) shown.add(index + cursor);
  }

  const rows: GrepRow[] = [...shown]
    .sort((a, b) => a - b)
    .map((index) => ({
      line: index + 1,
      text: lines[index] ?? "",
      match: matched.has(index),
      ranges: matched.has(index) && !options.invert ? rangesOnLine(lines[index] ?? "", expression) : [],
    }));

  return { rows, error: null };
}

function rangesOnLine(line: string, expression: RegExp) {
  expression.lastIndex = 0;
  const ranges: [number, number][] = [];
  for (const match of line.matchAll(expression)) {
    const start = match.index ?? 0;
    ranges.push([start, start + match[0].length]);
    if (match[0].length === 0) expression.lastIndex += 1;
  }
  return ranges;
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(20, Math.floor(value)));
}
