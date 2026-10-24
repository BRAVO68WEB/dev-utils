import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const buttonVariants = {
  primary: "border-transparent bg-accent text-accent-fg hover:opacity-90",
  ghost: "border-line bg-surface hover:bg-surface-2",
  danger: "border-line bg-surface text-err hover:bg-surface-2",
};

export const kbdClass =
  "inline-flex min-w-5 items-center justify-center rounded border border-line bg-surface-2 px-1 font-mono text-[11px] leading-5 text-muted";

export function Button({
  variant = "ghost",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonVariants }) {
  return (
    <button
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Banner({
  tone = "error",
  children,
  onDismiss,
}: {
  tone?: "error" | "warn" | "ok";
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const color = tone === "error" ? "text-err" : tone === "warn" ? "text-warn" : "text-ok";
  return (
    <div className={`flex items-start justify-between gap-3 border-b border-line bg-surface px-3 py-2 text-sm ${color}`} role="status">
      <p>{children}</p>
      {onDismiss ? (
        <button type="button" className="text-ink" onClick={onDismiss}>
          Dismiss
        </button>
      ) : null}
    </div>
  );
}

export function Loading() {
  return <p className="p-4 text-sm text-muted">Loading saved work…</p>;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`h-8 rounded-md border border-line bg-surface px-2 text-sm ${props.className ?? ""}`} />;
}

export const fieldClass =
  "h-8 w-full rounded-md border border-line bg-surface px-2 font-mono text-sm text-ink placeholder:text-muted";
