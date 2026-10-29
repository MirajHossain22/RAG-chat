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
    <div className="fixed top-4 right-4 z-50 flex w-[min(92vw,380px)] items-start gap-3 rounded-2xl border border-red-500/25 bg-[var(--panel)] p-4 text-sm shadow-xl" role="alert">
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
      <p className="min-w-0 flex-1 leading-5">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="grid size-6 shrink-0 place-items-center rounded-md text-[var(--muted)] transition hover:bg-red-500/10 hover:text-red-600"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
