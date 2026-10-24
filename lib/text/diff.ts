import { structuredPatch } from "diff";

export type RangeChange = {
  fromA: number;
  toA: number;
  fromB: number;
  toB: number;
};

export function summarizeDiff(before: string, after: string, ignoreWhitespace: boolean) {
  const patch = structuredPatch("before", "after", before, after, "", "", { ignoreWhitespace });
  const beforeStarts = lineStarts(before);
  const afterStarts = lineStarts(after);
  const changes: RangeChange[] = [];
  let added = 0;
  let removed = 0;

  for (const hunk of patch.hunks) {
    let beforeLine = hunk.oldStart;
    let afterLine = hunk.newStart;
    let pending: { fromA: number; fromB: number; toA: number; toB: number } | null = null;
    const flush = () => {
      if (!pending) return;
      const range = tighten(before, after, {
        fromA: offsetAt(beforeStarts, pending.fromA, before.length),
        toA: offsetAt(beforeStarts, pending.toA, before.length),
        fromB: offsetAt(afterStarts, pending.fromB, after.length),
        toB: offsetAt(afterStarts, pending.toB, after.length),
      });
      if (range) changes.push(range);
      pending = null;
    };

    for (const line of hunk.lines) {
      const tag = line[0];
      if (tag === " ") {
        flush();
        beforeLine += 1;
        afterLine += 1;
      } else if (tag === "-") {
        pending ??= { fromA: beforeLine, fromB: afterLine, toA: beforeLine, toB: afterLine };
        beforeLine += 1;
        pending.toA = beforeLine;
        removed += 1;
      } else if (tag === "+") {
        pending ??= { fromA: beforeLine, fromB: afterLine, toA: beforeLine, toB: afterLine };
        afterLine += 1;
        pending.toB = afterLine;
        added += 1;
      }
    }
    flush();
  }

  return { added, removed, changes };
}

function tighten(before: string, after: string, change: RangeChange): RangeChange | null {
  let { fromA, toA, fromB, toB } = change;
  while (fromA < toA && fromB < toB && before[fromA] === after[fromB]) {
    fromA += 1;
    fromB += 1;
  }
  while (fromA < toA && fromB < toB && before[toA - 1] === after[toB - 1]) {
    toA -= 1;
    toB -= 1;
  }
  if (fromA === toA && fromB === toB) return null;
  return { fromA, toA, fromB, toB };
}

function lineStarts(text: string) {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") starts.push(index + 1);
  }
  return starts;
}

function offsetAt(starts: number[], line: number, length: number) {
  if (line <= 1) return 0;
  const index = line - 1;
  if (index >= starts.length) return length;
  return starts[index] ?? length;
}
