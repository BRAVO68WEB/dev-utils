import { parseDocument, type YAMLError } from "yaml";

export type YamlProblem = {
  severity: "error" | "warning";
  message: string;
  line: number;
  column: number;
  from: number;
  to: number;
};

export function inspectYaml(source: string): { problems: YamlProblem[]; json: string | null } {
  if (!source.trim()) return { problems: [], json: null };
  const doc = parseDocument(source, { uniqueKeys: true });
  const problems = [...doc.errors, ...doc.warnings].map((error) => toProblem(source, error));
  const blocking = problems.some((problem) => problem.severity === "error");
  if (blocking) return { problems, json: null };
  const loose = parseDocument(source, { uniqueKeys: false });
  return { problems, json: JSON.stringify(loose.toJSON(), null, 2) };
}

function toProblem(source: string, error: YAMLError): YamlProblem {
  const from = error.pos?.[0] ?? 0;
  const to = error.pos?.[1] ?? from;
  const { line, column } = indexToLine(source, from);
  return {
    severity: error.code === "DUPLICATE_KEY" ? "warning" : error.name === "YAMLWarning" ? "warning" : "error",
    message: error.message,
    line,
    column,
    from,
    to,
  };
}

export function indexToLine(source: string, index: number) {
  const safe = Math.max(0, Math.min(index, source.length));
  let line = 1;
  let column = 1;
  for (let cursor = 0; cursor < safe; cursor += 1) {
    if (source[cursor] === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return { line, column };
}
