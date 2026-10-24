"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Banner, kbdClass } from "@/components/ui/chrome";
import { isDump, importDump, listSessionTimes } from "@/lib/db/index";
import { tools } from "@/lib/tools";
import type { ToolId } from "@/lib/types";

export function Launcher() {
  const [times, setTimes] = useState<Partial<Record<ToolId, number>>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listSessionTimes()
      .then((rows) => {
        const next: Partial<Record<ToolId, number>> = {};
        for (const row of rows) next[row.tool] = row.updatedAt;
        setTimes(next);
      })
      .catch(() => setError("Saved work in this browser could not be opened."));
  }, []);

  async function onImport(file: File) {
    try {
      const dump = JSON.parse(await file.text()) as unknown;
      if (!isDump(dump)) {
        setError("That file is not a Dev Utils export.");
        return;
      }
      await importDump(dump);
      setError(null);
      window.location.reload();
    } catch {
      setError("That file could not be imported.");
    }
  }

  return (
    <div className="h-full overflow-auto">
      {error ? <Banner onDismiss={() => setError(null)}>{error}</Banner> : null}
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-balance">Local tools for the request in front of you</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              Diffs, encodings, HTTP, webhooks, and notes stay in IndexedDB on this machine. The server only forwards requests.
            </p>
          </div>
          <label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-line bg-surface px-2.5 text-sm font-medium hover:bg-surface-2">
            Import
            <input
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onImport(file);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <li key={tool.id}>
              <Link href={tool.href} className="flex h-full flex-col gap-2 rounded-xl border border-line bg-surface p-4 hover:border-accent hover:bg-surface-2">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium">{tool.name}</span>
                  <kbd className={kbdClass}>{tool.shortcut}</kbd>
                </span>
                <span className="text-sm text-muted">{tool.blurb}</span>
                <span className="mt-auto text-xs text-muted">{times[tool.id] ? savedLabel(times[tool.id]!) : "Nothing saved yet"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function savedLabel(updatedAt: number) {
  const seconds = Math.round((Date.now() - updatedAt) / 1000);
  if (seconds < 60) return "Saved just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Saved ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `Saved ${hours}h ago`;
  return `Saved ${new Date(updatedAt).toLocaleDateString()}`;
}
