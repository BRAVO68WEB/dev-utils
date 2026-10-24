"use client";

import { useEffect, useState } from "react";
import { subscribe } from "@/lib/db/channel";
import { listByKind, listByParent } from "@/lib/db/index";
import type { RecordKind, ToolRecord } from "@/lib/types";

function visibleRecords<T>(records: ToolRecord<T>[], kind: RecordKind, parentId?: string | null) {
  return records
    .filter((row) => row.kind === kind && (parentId == null || row.parentId === parentId))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function useRecords<T>(kind: RecordKind, parentId?: string | null) {
  const [rows, setRows] = useState<ToolRecord<T>[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancel = false;
    const request = parentId != null ? listByParent<T>(parentId) : listByKind<T>(kind);
    request
      .then((records) => {
        if (cancel) return;
        setRows(visibleRecords(records, kind, parentId));
        setReady(true);
      })
      .catch(() => {
        if (!cancel) setReady(true);
      });
    return () => {
      cancel = true;
    };
  }, [kind, parentId]);

  useEffect(() => {
    return subscribe((message) => {
      if (message.store !== "records") return;
      const request = parentId != null ? listByParent<T>(parentId) : listByKind<T>(kind);
      request
        .then((records) => {
          setRows(visibleRecords(records, kind, parentId));
          setReady(true);
        })
        .catch(() => {});
    });
  }, [kind, parentId]);

  return { rows, ready };
}
