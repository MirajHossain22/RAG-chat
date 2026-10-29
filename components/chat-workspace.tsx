"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowUp,
  ArrowUpRight,
  BookOpenText,
  CircleStop,
  FileSearch,
  Files,
  MessageCircleQuestion,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { ChatMessage } from "@/components/chat-message";
import { CreatorFooter } from "@/components/creator-footer";
import { DocumentSidebar } from "@/components/document-sidebar";
import { ErrorToast } from "@/components/error-toast";
import { useDocumentLibrary } from "@/hooks/use-document-library";
import type { AppUIMessage } from "@/lib/chat-types";

const suggestions = [
  {
    icon: FileSearch,
    label: "Summarize the key findings",
    prompt:
      "Summarize the selected documents, including their central topic, key findings, supporting evidence, and recommendations.",
  },
  {
    icon: MessageCircleQuestion,
    label: "What are the main conclusions?",
    prompt:
      "What main conclusions do the selected documents reach, and what evidence supports each conclusion?",
  },
  {
    icon: BookOpenText,
    label: "Create a concise study guide",
    prompt:
      "Create a concise study guide from the selected documents with the key concepts, definitions, findings, and review questions.",
  },
];

export function ChatWorkspace({ userEmail }: { userEmail?: string }) {
  const [input, setInput] = useState("");
  const documentLibrary = useDocumentLibrary();
  const transport = useMemo(
    () =>
      new DefaultChatTransport<AppUIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            selectedDocumentIds: documentLibrary.selectedDocumentIds,
          },
          headers: documentLibrary.accessToken
            ? { Authorization: `Bearer ${documentLibrary.accessToken}` }
            : undefined,
        }),
      }),
    [documentLibrary.accessToken, documentLibrary.selectedDocumentIds],
  );
  const { messages, sendMessage, status, stop, error, clearError } =
    useChat<AppUIMessage>({ transport });
  const isWorking = status === "submitted" || status === "streaming";
  const visibleError =
    error?.message ||
    documentLibrary.libraryError ||
    (documentLibrary.uploadState.stage === "error"
      ? documentLibrary.uploadState.message
      : undefined);

  async function submitMessage(text: string) {
    const cleanText = text.trim();
    if (!cleanText || isWorking || !documentLibrary.isReady) return;

    setInput("");
    await sendMessage({ text: cleanText });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(input);
  }

  return (
    <main className="app-backdrop min-h-dvh p-0 sm:p-3 lg:p-5">
      <ErrorToast
        message={visibleError}
        onDismiss={() => {
          clearError();
          documentLibrary.dismissError();
        }}
      />
      <div className="app-shell animate-enter mx-auto grid h-dvh max-w-[1540px] grid-rows-[auto_1fr] overflow-hidden sm:h-[calc(100dvh-1.5rem)] sm:rounded-[28px] lg:h-[calc(100dvh-2.5rem)] lg:grid-cols-[320px_1fr] lg:grid-rows-1">
        <DocumentSidebar
          documents={documentLibrary.documents}
          selectedDocumentIds={documentLibrary.selectedDocumentIds}
          isLoading={documentLibrary.isLoading}
          isReady={documentLibrary.isReady}
          deletingId={documentLibrary.deletingId}
          uploadState={documentLibrary.uploadState}
          error={documentLibrary.libraryError}
          userEmail={userEmail}
          onUpload={documentLibrary.uploadDocument}
          onDelete={documentLibrary.deleteDocument}
          onToggleDocument={documentLibrary.toggleDocument}
          onSelectAll={documentLibrary.selectAllDocuments}
          onSignOut={documentLibrary.signOut}
        />

        <section className="relative flex min-h-0 flex-col overflow-hidden bg-[color-mix(in_srgb,var(--panel)_72%,transparent)]">
          <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-[var(--line)] px-5 sm:px-7">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate text-sm font-semibold tracking-[-0.02em]">New conversation</h1>
                {documentLibrary.selectedDocumentIds.length > 0 && (
                  <span className="hidden rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)] sm:inline">
                    {documentLibrary.selectedDocumentIds.length} selected
                  </span>
                )}
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--muted)]">
                <ShieldCheck className="size-3" />
                Private, source-grounded workspace
              </p>
            </div>
            <span className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel-muted)] px-3 py-1.5 text-[11px] font-semibold text-[var(--muted-strong)] shadow-sm">
              <span className={`size-1.5 rounded-full ${documentLibrary.isReady ? "status-pulse bg-[var(--accent)]" : "animate-pulse bg-amber-400"}`} />
              {documentLibrary.isReady ? "System ready" : "Connecting"}
            </span>
          </header>

          <div className="scrollbar-thin relative flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="subtle-grid pointer-events-none absolute inset-0 opacity-70" />
            {messages.length === 0 ? (
              <div className="animate-enter relative m-auto flex w-full max-w-3xl flex-col items-center px-5 py-12 text-center sm:px-8">
                <span className="mb-6 grid size-14 place-items-center rounded-[20px] border border-[var(--line-strong)] bg-[var(--panel)] text-[var(--accent)] shadow-[0_16px_40px_var(--accent-glow)] backdrop-blur">
                  <Sparkles className="size-5.5" />
                </span>
                <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-[var(--accent)] uppercase">
                  Evidence, not guesswork
                </p>
                <h2 className="shimmer-text font-[family-name:var(--font-display)] text-4xl leading-[1.08] font-semibold tracking-[-0.055em] sm:text-[3.55rem]">
                  Ask your documents.
                  <br /> Get answers you can trace.
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-[15px] sm:leading-7">
                  Select the reports that matter, ask in plain language, and follow every citation back to the exact page.
                </p>

                <div className="mt-9 grid w-full gap-3 sm:grid-cols-3">
                  {suggestions.map(({ icon: Icon, label, prompt }, index) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => void submitMessage(prompt)}
                      disabled={
                        isWorking ||
                        !documentLibrary.isReady ||
                        documentLibrary.selectedDocumentIds.length === 0
                      }
                      className="button-orbit surface-shine group relative min-h-32 rounded-[20px] border border-[var(--line)] bg-[var(--panel)] p-4 text-left text-sm shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:border-[var(--line-strong)] hover:shadow-[0_18px_45px_rgba(0,0,0,0.10)] disabled:pointer-events-none disabled:opacity-45"
                    >
                      <span className="mb-5 grid size-9 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] transition-transform group-hover:scale-105">
                        <Icon className="size-4" />
                      </span>
                      <span className="block max-w-[12rem] font-medium leading-5">{label}</span>
                      <span className="absolute top-4 right-4 text-[10px] font-mono text-[var(--muted)]">0{index + 1}</span>
                      <ArrowUpRight className="icon-drift absolute right-4 bottom-4 size-3.5 text-[var(--muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>

                {documentLibrary.documents.length === 0 && (
                  <p className="mt-5 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                    <Files className="size-3.5" />
                    Upload a PDF to unlock document-grounded prompts
                  </p>
                )}
              </div>
            ) : (
              <div className="animate-enter relative mx-auto flex w-full max-w-4xl flex-col gap-7 px-5 py-8 sm:px-8 lg:py-10">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {status === "submitted" && (
                  <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--muted)] shadow-sm backdrop-blur">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
                      <span className="relative inline-flex size-2 rounded-full bg-[var(--accent)]" />
                    </span>
                    Searching your selected documents…
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative shrink-0 border-t border-[var(--line)] bg-[var(--panel)] px-4 py-4 backdrop-blur-xl sm:px-7 sm:py-5">
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex max-w-4xl items-end gap-2 rounded-[20px] border border-[var(--line)] bg-[var(--panel-muted)] p-2 shadow-sm transition focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-[var(--accent-soft)]"
            >
              <textarea
                aria-label="Message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void submitMessage(input);
                  }
                }}
                placeholder="Ask a question about your documents…"
                rows={1}
                maxLength={12000}
                className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-[var(--muted)]"
              />
              {isWorking ? (
                <button
                  type="button"
                  onClick={stop}
                  aria-label="Stop generating"
                  className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[var(--foreground)] text-[var(--background)] shadow-sm transition hover:scale-95"
                >
                  <CircleStop className="size-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={!input.trim() || !documentLibrary.isReady}
                  className="button-glow surface-shine group grid size-11 shrink-0 place-items-center rounded-[14px] bg-[var(--accent)] text-white shadow-[0_10px_25px_var(--accent-glow)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-35 dark:text-[#07140d]"
                >
                  <ArrowUp className="icon-drift size-4" strokeWidth={2.4} />
                </button>
              )}
            </form>
            <div className="mx-auto mt-2.5 flex max-w-4xl flex-col items-center justify-between gap-1.5 sm:flex-row">
              <p className="text-center text-[10px] tracking-wide text-[var(--muted)] sm:text-left">
                Context answers only from your selected documents · Enter to send
              </p>
              <CreatorFooter compact />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
