"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Button, kbdClass } from "@/components/ui/chrome";
import { clearAll, clearTool, exportAll, exportTool, listByKind, putSetting } from "@/lib/db/index";
import { downloadJson } from "@/lib/download";
import { applyTheme, emitTheme, nextTheme, readThemeChoice, subscribeTheme, themeLabel } from "@/lib/theme";
import { toolByShortcut, toolFromPath, tools } from "@/lib/tools";
import { ToolSwitcher } from "@/components/shell/tool-switcher";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const tool = toolFromPath(pathname);
  const [open, setOpen] = useState(false);
  const [nav, setNav] = useState(false);
  const theme = useSyncExternalStore(subscribeTheme, readThemeChoice, () => "system" as const);

  useEffect(() => {
    if (!tool) return;
    void putSetting("last-tool", tool.id).catch(() => {});
  }, [tool]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable='true'], .cm-content")) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const next = toolByShortcut(event.key);
      if (next) router.push(next.href);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  async function onExport() {
    const dump = tool ? await exportTool(tool.id) : await exportAll();
    downloadJson(tool ? `dev-utils-${tool.id}.json` : "dev-utils.json", dump);
  }

  async function onClear() {
    if (tool) {
      const message =
        tool.id === "hooks"
          ? "Clear every inbox and captured request stored in this browser?"
          : `Clear saved ${tool.name} data in this browser?`;
      if (!window.confirm(message)) return;
      if (tool.id === "hooks") {
        const inboxes = await listByKind("webhook-inbox");
        await Promise.all(inboxes.map((inbox) => fetch(`/api/inboxes/${inbox.id}`, { method: "DELETE" })));
      }
      await clearTool(tool.id);
      return;
    }
    if (!window.confirm("Clear every tool saved in this browser?")) return;
    const inboxes = await listByKind("webhook-inbox").catch(() => []);
    await Promise.all(inboxes.map((inbox) => fetch(`/api/inboxes/${inbox.id}`, { method: "DELETE" })));
    await clearAll();
  }

  function cycleTheme() {
    const next = nextTheme(readThemeChoice());
    applyTheme(next);
    emitTheme();
    void putSetting("theme", next).catch(() => {});
  }

  return (
    <div className="flex h-dvh bg-bg text-ink">
      <Rail pathname={pathname} className="hidden md:flex" />
      {nav ? (
        <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setNav(false)}>
          <div className="h-full w-64 bg-surface" onClick={(event) => event.stopPropagation()}>
            <Rail
              pathname={pathname}
              className="flex"
              onNavigate={() => setNav(false)}
              footer={<ShellActions stacked onExport={onExport} onClear={onClear} onTheme={cycleTheme} theme={theme} />}
            />
          </div>
        </div>
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-surface px-3">
          <Button type="button" className="md:hidden" onClick={() => setNav(true)}>
            Tools
          </Button>
          <h1 className="min-w-0 flex-1 truncate text-2xl font-semibold leading-none tracking-tight">{tool?.name ?? "Dev Utils"}</h1>
          <Button type="button" variant="primary" onClick={() => setOpen(true)}>
            Jump
            <span className="font-[ui-sans-serif] text-[11px] tracking-normal opacity-80">⌘K</span>
          </Button>
          <div className="hidden items-center gap-2 sm:flex">
            <ShellActions onExport={onExport} onClear={onClear} onTheme={cycleTheme} theme={theme} />
          </div>
        </header>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
      <ToolSwitcher open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function ShellActions({
  onExport,
  onClear,
  onTheme,
  theme,
  stacked = false,
}: {
  onExport: () => Promise<void>;
  onClear: () => Promise<void>;
  onTheme: () => void;
  theme: ReturnType<typeof readThemeChoice>;
  stacked?: boolean;
}) {
  const width = stacked ? "w-full" : "";
  return (
    <>
      <Button type="button" className={width} onClick={() => void onExport()}>
        Export
      </Button>
      <Button type="button" className={width} variant="danger" onClick={() => void onClear()}>
        Clear
      </Button>
      <Button type="button" className={width} onClick={onTheme} aria-label={`Theme: ${themeLabel(theme)}. Change theme`}>
        {themeLabel(theme)}
      </Button>
    </>
  );
}

function Rail({
  pathname,
  className,
  onNavigate,
  footer,
}: {
  pathname: string;
  className: string;
  onNavigate?: () => void;
  footer?: ReactNode;
}) {
  return (
    <aside className={`${className} w-56 shrink-0 flex-col border-r border-line bg-surface`}>
      <Link href="/" onClick={onNavigate} className="border-b border-line px-3 py-3">
        <span className="block text-sm font-semibold">Dev Utils</span>
        <span className="block text-xs text-muted">Saved in this browser</span>
      </Link>
      <nav className="flex-1 overflow-auto p-2" aria-label="Tools">
        <ul className="flex flex-col gap-0.5">
          {tools.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={`flex items-center justify-between rounded-md px-2 py-1.5 text-sm ${active ? "bg-surface-2 font-medium text-accent" : "hover:bg-surface-2"}`}
                >
                  <span>{item.name}</span>
                  <kbd className={kbdClass}>{item.shortcut}</kbd>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {footer ? <div className="flex flex-col gap-2 border-t border-line p-2 sm:hidden">{footer}</div> : null}
    </aside>
  );
}
