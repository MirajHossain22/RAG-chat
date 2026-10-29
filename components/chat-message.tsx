import { ArrowUpRight, FileText, Sparkles } from "lucide-react";

import type { AppUIMessage, RetrievedSource } from "@/lib/chat-types";

function citationId(messageId: string, sourceId: number) {
  return `citation-${messageId}-${sourceId}`;
}

function sourceId(messageId: string, sourceId: number) {
  return `source-${messageId}-${sourceId}`;
}

function CitationText({
  messageId,
  sources,
  text,
}: {
  messageId: string;
  sources: RetrievedSource[];
  text: string;
}) {
  const sourceIds = new Set(sources.map((source) => source.id));
  const linkedCitations = new Set<number>();
  const pieces = text.split(/(\[\d+\])/g);

  return (
    <p className="whitespace-pre-wrap">
      {pieces.map((piece, index) => {
        const match = /^\[(\d+)\]$/.exec(piece);
        if (!match) return piece;

        const id = Number(match[1]);
        if (!sourceIds.has(id)) return piece;

        const isFirstReference = !linkedCitations.has(id);
        linkedCitations.add(id);

        return (
          <a
            key={`${id}-${index}`}
            id={isFirstReference ? citationId(messageId, id) : undefined}
            href={`#${sourceId(messageId, id)}`}
            aria-label={`Open source ${id}`}
            className="mx-0.5 inline-flex min-w-5 items-center justify-center rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 align-baseline text-[11px] font-semibold leading-4 text-[var(--accent)] no-underline transition hover:ring-1 hover:ring-[var(--accent)]"
          >
            [{id}]
          </a>
        );
      })}
    </p>
  );
}

function SourceCards({
  messageId,
  sources,
}: {
  messageId: string;
  sources: RetrievedSource[];
}) {
  if (sources.length === 0) return null;

  return (
    <section className="mt-5" aria-label="Sources">
      <p className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-[var(--muted)] uppercase">
        Sources
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {sources.map((source) => (
          <a
            key={source.id}
            id={sourceId(messageId, source.id)}
            href={`#${citationId(messageId, source.id)}`}
            className="group scroll-mt-24 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-3 no-underline transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-sm target:border-[var(--accent)] target:ring-2 target:ring-[var(--accent-soft)]"
          >
            <span className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <FileText className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold" title={source.fileName}>
                    {source.fileName}
                  </span>
                  <ArrowUpRight className="size-3 shrink-0 text-[var(--muted)] transition group-hover:text-[var(--accent)]" />
                </span>
                <span className="mt-0.5 block text-[10px] text-[var(--accent)]">
                  Page {source.pageNumber} · [{source.id}]
                </span>
              </span>
            </span>
            <span className="mt-2 line-clamp-3 block text-xs leading-5 text-[var(--muted)]">
              {source.snippet}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

export function ChatMessage({ message }: { message: AppUIMessage }) {
  const sourcePart = message.parts.find((part) => part.type === "data-sources");
  const sources = sourcePart?.data.sources ?? [];

  if (message.role === "user") {
    return (
      <article className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[var(--foreground)] px-4 py-3 text-sm leading-6 text-[var(--background)]">
        {message.parts.map((part, index) =>
          part.type === "text" ? (
            <p className="whitespace-pre-wrap" key={index}>
              {part.text}
            </p>
          ) : null,
        )}
      </article>
    );
  }

  return (
    <article className="max-w-[96%] text-sm leading-7">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--accent)]">
        <Sparkles className="size-3.5" />
        Context
      </div>
      {message.parts.map((part, index) =>
        part.type === "text" ? (
          <CitationText
            key={index}
            messageId={message.id}
            sources={sources}
            text={part.text}
          />
        ) : null,
      )}
      <SourceCards messageId={message.id} sources={sources} />
    </article>
  );
}
