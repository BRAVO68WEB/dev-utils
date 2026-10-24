"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QUOTA_MESSAGE } from "@/lib/defaults";
import { dbSource, subscribe } from "@/lib/db/channel";
import { getSession, putSession } from "@/lib/db/index";
import { isQuotaError, shouldSaveSession } from "@/lib/db/session-state";
import type { SessionStateMap, ToolId } from "@/lib/types";

export function useSession<K extends ToolId>(tool: K, initial: SessionStateMap[K]) {
  type State = SessionStateMap[K];
  const initialRef = useRef(initial);
  const currentRef = useRef(initial);
  const dirty = useRef(false);
  const [state, setCurrent] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    getSession(tool)
      .then((saved) => {
        if (cancel) return;
        const next = saved ?? initialRef.current;
        currentRef.current = next;
        setCurrent(next);
        setReady(true);
      })
      .catch(() => {
        if (cancel) return;
        setError("Saved work in this browser could not be opened.");
        setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, [tool]);

  useEffect(() => {
    return subscribe((message) => {
      if (message.store !== "sessions") return;
      if (message.key !== tool && message.key !== "*") return;
      if (message.source === dbSource && message.reason !== "reset") return;
      void getSession(tool).then((saved) => {
        const next = saved ?? initialRef.current;
        dirty.current = false;
        currentRef.current = next;
        setCurrent(next);
      });
    });
  }, [tool]);

  useEffect(() => {
    if (!shouldSaveSession(ready, dirty.current)) return;
    const handle = window.setTimeout(() => {
      void putSession(tool, currentRef.current).catch((saveError: unknown) => {
        setError(isQuotaError(saveError) ? QUOTA_MESSAGE : "Could not save this tool in the browser.");
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [ready, state, tool]);

  const setState = useCallback((value: State | ((prev: State) => State)) => {
    dirty.current = true;
    setCurrent((prev) => {
      const next = typeof value === "function" ? (value as (prev: State) => State)(prev) : value;
      currentRef.current = next;
      return next;
    });
  }, []);

  return { state, setState, ready, error, dismissError: () => setError(null) };
}
