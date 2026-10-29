"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowUp,
  BookOpenText,
  CircleStop,
  FileSearch,
  MessageCircleQuestion,
  Sparkles,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { ChatMessage } from "@/components/chat-message";
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
    <main className="min-h-dvh bg-[var(--background)] p-0 sm:p-3 lg:p-5">
      <ErrorToast
        message={visibleError}
        onDismiss={() => {
          clearError();
          documentLibrary.dismissError();
        }}
      />
      <div className="mx-auto grid h-dvh max-w-[1500px] grid-rows-[auto_1fr] overflow-hidden border-[var(--line)] bg-[var(--panel)] shadow-[0_24px_80px_rgba(31,38,31,0.08)] sm:h-[calc(100dvh-1.5rem)] sm:rounded-[24px] sm:border lg:h-[calc(100dvh-2.5rem)] lg:grid-cols-[300px_1fr] lg:grid-rows-1">
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

        <section className="relative flex min-h-0 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--line)] px-5 sm:px-7">
            <div>
              <h1 className="text-sm font-semibold">New conversation</h1>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Grounded document retrieval
              </p>
            </div>
            <span className="flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-medium text-[var(--accent)]">
              <span className="size-1.5 rounded-full bg-current" />
              {documentLibrary.isReady ? "Ready" : "Connecting"}
            </span>
          </header>

          <div className="subtle-grid scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto">
            {messages.length === 0 ? (
              <div className="m-auto flex w-full max-w-2xl flex-col items-center px-5 py-12 text-center sm:px-8">
                <span className="mb-5 grid size-12 place-items-center rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-sm">
                  <Sparkles className="size-5 text-[var(--accent)]" />
                </span>
                <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">
                  Ask with confidence
                </p>
                <h2 className="font-[family-name:var(--font-display)] text-4xl leading-tight tracking-[-0.025em] sm:text-5xl">
                  Turn documents into
                  <br /> clear answers.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--muted)] sm:text-base">
                  Upload a PDF, choose the documents to search, and get answers
                  grounded in the most relevant pages.
                </p>

                <div className="mt-8 grid w-full gap-2 sm:grid-cols-3">
                  {suggestions.map(({ icon: Icon, label, prompt }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => void submitMessage(prompt)}
                      disabled={
                        isWorking ||
                        !documentLibrary.isReady ||
                        documentLibrary.selectedDocumentIds.length === 0
                      }
                      className="group rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4 text-left text-sm transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Icon className="mb-3 size-4 text-[var(--accent)]" />
                      <span className="leading-5">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-8 sm:px-8">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {status === "submitted" && (
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <span className="size-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
                    Thinking…
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-[var(--line)] bg-[var(--panel)] px-4 py-4 sm:px-7 sm:py-5">
            <form
              onSubmit={handleSubmit}
              className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[var(--line)] bg-[var(--background)] p-2 shadow-sm focus-within:border-[var(--accent)]"
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
                className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[var(--muted)]"
              />
              {isWorking ? (
                <button
                  type="button"
                  onClick={stop}
                  aria-label="Stop generating"
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--foreground)] text-[var(--background)] transition-opacity hover:opacity-80"
                >
                  <CircleStop className="size-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={!input.trim() || !documentLibrary.isReady}
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35 dark:text-[#142219]"
                >
                  <ArrowUp className="size-4" strokeWidth={2.4} />
                </button>
              )}
            </form>
            <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-[var(--muted)]">
              Answers are limited to your selected documents
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
