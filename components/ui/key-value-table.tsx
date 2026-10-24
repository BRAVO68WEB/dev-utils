"use client";

import { Button, fieldClass } from "@/components/ui/chrome";
import { fieldRow, type FieldRow } from "@/lib/types";

export function KeyValueTable({
  rows,
  onChange,
  namePlaceholder = "Name",
  valuePlaceholder = "Value",
}: {
  rows: FieldRow[];
  onChange: (rows: FieldRow[]) => void;
  namePlaceholder?: string;
  valuePlaceholder?: string;
}) {
  function update(id: string, patch: Partial<FieldRow>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.length === 0 ? <p className="text-sm text-muted">No rows yet.</p> : null}
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={row.enabled}
            aria-label={`Include ${row.name || "row"}`}
            onChange={(event) => update(row.id, { enabled: event.target.checked })}
          />
          <input
            className={fieldClass}
            value={row.name}
            placeholder={namePlaceholder}
            aria-label={namePlaceholder}
            onChange={(event) => update(row.id, { name: event.target.value })}
          />
          <input
            className={fieldClass}
            value={row.value}
            placeholder={valuePlaceholder}
            aria-label={valuePlaceholder}
            onChange={(event) => update(row.id, { value: event.target.value })}
          />
          <Button type="button" aria-label={`Remove ${row.name || "row"}`} onClick={() => onChange(rows.filter((item) => item.id !== row.id))}>
            Remove
          </Button>
        </div>
      ))}
      <div>
        <Button type="button" onClick={() => onChange([...rows, fieldRow()])}>
          Add row
        </Button>
      </div>
    </div>
  );
}
