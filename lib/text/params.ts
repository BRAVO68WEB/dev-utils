export type ParsedParam = { name: string; value: string };

export function parseParams(input: string):
  | { ok: true; rows: ParsedParam[]; hash: string }
  | { ok: false; error: string } {
  if (!input.trim()) return { ok: false, error: "Paste a full URL, including the scheme." };
  try {
    const url = new URL(input);
    return {
      ok: true,
      rows: [...url.searchParams.entries()].map(([name, value]) => ({ name, value })),
      hash: url.hash,
    };
  } catch {
    return { ok: false, error: "That string is not a URL this parser can read." };
  }
}

export function updateParams(input: string, rows: ParsedParam[]) {
  const url = new URL(input);
  const params = new URLSearchParams();
  for (const row of rows) {
    if (row.name === "") continue;
    params.append(row.name, row.value);
  }
  url.search = params.toString();
  return url.toString();
}
