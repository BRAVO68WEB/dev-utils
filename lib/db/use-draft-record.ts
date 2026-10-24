"use client";

import { useEffect, useRef, useState } from "react";
import { putRecord } from "@/lib/db/index";
import type { ToolRecord } from "@/lib/types";

export function useDraftRecord<T>(record: ToolRecord<T> | null) {
  const [draft, setDraft] = useState<T | null>(record?.body ?? null);
  const [title, setTitle] = useState(record?.title ?? "");
  const dirty = useRef(false);
  const recordRef = useRef(record);
  const id = record?.id ?? null;

  useEffect(() => {
    recordRef.current = record;
  });

  useEffect(() => {
    dirty.current = false;
    setDraft(recordRef.current?.body ?? null);
    setTitle(recordRef.current?.title ?? "");
  }, [id]);

  useEffect(() => {
    const current = recordRef.current;
    if (!current || !dirty.current || draft == null) return;
    const snapshot: ToolRecord<T> = { ...current, title, body: draft, updatedAt: Date.now() };
    const handle = window.setTimeout(() => {
      dirty.current = false;
      void putRecord(snapshot);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [draft, title, id]);

  return {
    draft,
    title,
    update(next: T) {
      dirty.current = true;
      setDraft(next);
    },
    updateTitle(next: string) {
      dirty.current = true;
      setTitle(next);
    },
  };
}
