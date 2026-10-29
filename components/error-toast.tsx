"use client";

import { AlertCircle, X } from "lucide-react";

export function ErrorToast({
  message,
  onDismiss,
}: {
  message?: string;
  onDismiss: () => void;
}) {
  if (!message) return null;

  return (
    <div className="animate-enter app-shell fixed top-4 right-4 z-50 flex w-[min(92vw,400px)] items-start gap-3 rounded-2xl border-red-500/25 p-4 text-sm shadow-2xl" role="alert">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-red-500/10 text-[var(--danger)]">
        <AlertCircle className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">Something needs attention</p>
        <p className="mt-1 leading-5 text-[var(--muted-strong)]">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="grid size-7 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-red-500/10 hover:text-[var(--danger)]"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
