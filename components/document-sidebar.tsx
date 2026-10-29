"use client";

import {
  Check,
  FileText,
  FolderOpen,
  Leaf,
  LoaderCircle,
  LogOut,
  LockKeyhole,
  Trash2,
  Upload,
} from "lucide-react";

import type {
  DocumentRecord,
  UploadState,
} from "@/hooks/use-document-library";

type DocumentSidebarProps = {
  documents: DocumentRecord[];
  selectedDocumentIds: string[];
  isLoading: boolean;
  isReady: boolean;
  deletingId?: string;
  uploadState: UploadState;
  error?: string;
  userEmail?: string;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleDocument: (id: string) => void;
  onSelectAll: () => void;
  onSignOut: () => Promise<void>;
};

function UploadFeedback({ state }: { state: UploadState }) {
  if (state.stage === "idle") {
    return <span>PDF only · up to 8 MB</span>;
  }
  if (state.stage === "uploading") {
    return <span>Uploading… {state.progress}%</span>;
  }
  if (state.stage === "processing") {
    return <span>Extracting text & embedding…</span>;
  }
  if (state.stage === "success") {
    return <span>{state.message}</span>;
  }
  return <span className="text-red-600 dark:text-red-400">{state.message}</span>;
}

export function DocumentSidebar({
  documents,
  selectedDocumentIds,
  isLoading,
  isReady,
  deletingId,
  uploadState,
  error,
  userEmail,
  onUpload,
  onDelete,
  onToggleDocument,
  onSelectAll,
  onSignOut,
}: DocumentSidebarProps) {
  const isProcessing =
    uploadState.stage === "uploading" || uploadState.stage === "processing";

  return (
    <aside className="flex min-h-0 flex-col border-b border-[var(--line)] bg-[var(--panel)] lg:border-r lg:border-b-0">
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-5 lg:px-6">
        <span className="grid size-9 place-items-center rounded-xl bg-[var(--accent)] text-white dark:text-[#142219]">
          <Leaf className="size-4" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold tracking-[-0.02em]">Context</p>
          <p className="text-xs text-[var(--muted)]">Document intelligence</p>
        </div>
        <button
          type="button"
          onClick={() => void onSignOut()}
          aria-label="Sign out"
          title="Sign out"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] lg:hidden"
        >
          <LogOut className="size-4" />
        </button>
      </div>

      <div className="p-4 lg:p-5">
        <label
          className={`group flex min-h-24 items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--background)] px-4 text-sm transition-colors lg:min-h-32 lg:flex-col ${
            isProcessing || !isReady
              ? "cursor-wait opacity-70"
              : "cursor-pointer hover:border-[var(--accent)]"
          }`}
        >
          <input
            className="sr-only"
            type="file"
            accept="application/pdf,.pdf"
            disabled={isProcessing || !isReady}
            onChange={async (event) => {
              const input = event.currentTarget;
              const file = input.files?.[0];
              if (file) await onUpload(file);
              input.value = "";
            }}
          />
          <span className="grid size-10 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            {isProcessing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : uploadState.stage === "success" ? (
              <Check className="size-4" />
            ) : (
              <Upload className="size-4" />
            )}
          </span>
          <span className="min-w-0 text-center">
            <span className="block font-medium">
              {isProcessing ? "Processing document" : "Upload a PDF"}
            </span>
            <span className="mt-1 block max-w-52 truncate text-xs text-[var(--muted)]">
              <UploadFeedback state={uploadState} />
            </span>
          </span>
        </label>

        {error && (
          <p className="mt-3 text-xs leading-5 text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="hidden min-h-0 flex-1 flex-col px-5 pb-5 lg:flex">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
            Your library
          </p>
          {documents.length > 0 ? (
            <button
              type="button"
              onClick={onSelectAll}
              disabled={selectedDocumentIds.length === documents.length}
              className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] text-[var(--muted)] transition hover:border-[var(--accent)] disabled:cursor-default disabled:opacity-70"
            >
              {selectedDocumentIds.length === documents.length
                ? "All selected"
                : `${selectedDocumentIds.length}/${documents.length} selected`}
            </button>
          ) : (
            <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
              0 files
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--background)]">
            <LoaderCircle className="size-5 animate-spin text-[var(--muted)]" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--background)] px-5 text-center">
            <span className="relative mb-4 grid size-12 place-items-center rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
              <FolderOpen className="size-5 text-[var(--muted)]" />
              <FileText className="absolute -right-1 -bottom-1 size-5 rounded-md bg-[var(--accent-soft)] p-1 text-[var(--accent)]" />
            </span>
            <p className="text-sm font-medium">No documents yet</p>
            <p className="mt-1 max-w-44 text-xs leading-5 text-[var(--muted)]">
              Upload a text-based PDF to build your library.
            </p>
          </div>
        ) : (
          <div className="scrollbar-thin min-h-0 flex-1 space-y-2 overflow-y-auto">
            {documents.map((document) => (
              <div
                key={document.id}
                className={`group flex items-center gap-3 rounded-xl border bg-[var(--background)] p-3 transition ${
                  selectedDocumentIds.includes(document.id)
                    ? "border-[var(--accent)]"
                    : "border-[var(--line)] opacity-65"
                }`}
              >
                <button
                  type="button"
                  aria-label={`${selectedDocumentIds.includes(document.id) ? "Exclude" : "Include"} ${document.fileName}`}
                  onClick={() => onToggleDocument(document.id)}
                  className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]"
                >
                  <FileText className="size-4" />
                  {selectedDocumentIds.includes(document.id) && (
                    <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-white dark:text-[#142219]">
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium" title={document.fileName}>
                    {document.fileName}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    {document.pageCount} {document.pageCount === 1 ? "page" : "pages"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${document.fileName}`}
                  disabled={deletingId === document.id}
                  onClick={() => {
                    if (window.confirm(`Delete “${document.fileName}”?`)) {
                      void onDelete(document.id);
                    }
                  }}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--muted)] opacity-0 transition hover:bg-red-500/10 hover:text-red-600 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                >
                  {deletingId === document.id ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden items-center gap-2 border-t border-[var(--line)] px-5 py-3 text-xs text-[var(--muted)] lg:flex">
        <LockKeyhole className="size-3.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate" title={userEmail}>
          {userEmail ?? "Private workspace"}
        </span>
        <button
          type="button"
          onClick={() => void onSignOut()}
          aria-label="Sign out"
          title="Sign out"
          className="grid size-8 shrink-0 place-items-center rounded-lg transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    </aside>
  );
}
