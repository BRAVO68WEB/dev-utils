"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

export function SplitPane({ first, second }: { first: ReactNode; second: ReactNode }) {
  const [ratio, setRatio] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const horizontal = window.matchMedia("(min-width: 768px)").matches;
    function move(client: number) {
      const raw = horizontal ? ((client - rect.left) / rect.width) * 100 : ((client - rect.top) / rect.height) * 100;
      setRatio(Math.min(75, Math.max(25, raw)));
    }
    function onMove(moveEvent: PointerEvent) {
      move(horizontal ? moveEvent.clientX : moveEvent.clientY);
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    event.preventDefault();
  }

  return (
    <div ref={containerRef} className="flex h-full min-h-0 flex-col md:flex-row">
      <div className="min-h-0 min-w-0 overflow-auto" style={{ flexBasis: `${ratio}%` }}>
        {first}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(ratio)}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowUp") setRatio((value) => Math.max(25, value - 2));
          if (event.key === "ArrowRight" || event.key === "ArrowDown") setRatio((value) => Math.min(75, value + 2));
        }}
        className="h-2 shrink-0 cursor-row-resize bg-line hover:bg-accent md:h-auto md:w-1.5 md:cursor-col-resize"
      />
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">{second}</div>
    </div>
  );
}
