"use client";

import { Button } from "@/components/ui/chrome";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex h-full flex-col items-start gap-3 p-6">
      <h2 className="text-base font-semibold">This page hit an error</h2>
      <p className="max-w-xl text-sm text-muted">{error.message || "Something went wrong while rendering this tool."}</p>
      <Button type="button" variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
