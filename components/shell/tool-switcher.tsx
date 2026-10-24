"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { kbdClass } from "@/components/ui/chrome";
import { tools } from "@/lib/tools";

export function ToolSwitcher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [seenOpen, setSeenOpen] = useState(open);
  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) setQuery("");
  }

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, open]);

  if (!open) return null;
  const needle = query.trim().toLowerCase();
  const matches = tools.filter((tool) => `${tool.name} ${tool.blurb}`.toLowerCase().includes(needle));

  return (
    <div className="fixed inset-0 z-30 flex items-start justify-center bg-black/40 p-4 pt-[12vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Switch tool"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-[0_18px_50px_-24px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Jump to a tool"
          aria-label="Filter tools"
          className="h-11 w-full border-b border-line bg-surface px-3 text-sm outline-none"
        />
        <ul className="max-h-80 overflow-auto p-1">
          {matches.map((tool) => (
            <li key={tool.id}>
              <Link href={tool.href} onClick={onClose} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-surface-2">
                <span>
                  <span className="block font-medium">{tool.name}</span>
                  <span className="block text-xs text-muted">{tool.blurb}</span>
                </span>
                <kbd className={kbdClass}>{tool.shortcut}</kbd>
              </Link>
            </li>
          ))}
          {matches.length === 0 ? <li className="px-2 py-3 text-sm text-muted">No matching tool.</li> : null}
        </ul>
      </div>
    </div>
  );
}
