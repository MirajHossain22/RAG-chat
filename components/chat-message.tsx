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
            className="mx-0.5 inline-flex min-w-6 items-center justify-center rounded-lg border border-[var(--accent)]/15 bg-[var(--accent-soft)] px-1.5 py-0.5 align-baseline text-[11px] font-semibold leading-4 text-[var(--accent)] no-underline transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_5px_14px_var(--accent-glow)]"
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
    <section className="mt-6 border-t border-[var(--line)] pt-5" aria-label="Sources">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
          Retrieved evidence
        </p>
        <span className="rounded-full border border-[var(--line)] bg-[var(--panel-muted)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
          {sources.length} {sources.length === 1 ? "source" : "sources"}
        </span>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {sources.map((source) => (
          <a
            key={source.id}
            id={sourceId(messageId, source.id)}
            href={`#${citationId(messageId, source.id)}`}
            className="surface-shine group scroll-mt-24 rounded-2xl border border-[var(--line)] bg-[var(--panel-muted)] p-3.5 no-underline transition hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] target:border-[var(--accent)] target:ring-4 target:ring-[var(--accent-soft)]"
          >
            <span className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--accent)]/10 bg-[var(--accent-soft)] text-[var(--accent)]">
                <FileText className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold" title={source.fileName}>
                    {source.fileName}
                  </span>
                  <ArrowUpRight className="size-3.5 shrink-0 text-[var(--muted)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
                </span>
                <span className="mt-1 block text-[10px] font-medium text-[var(--accent)]">
                  Page {source.pageNumber} · [{source.id}]
                </span>
              </span>
            </span>
            <span className="mt-3 line-clamp-3 block text-xs leading-5 text-[var(--muted)]">
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
      <article className="animate-enter ml-auto max-w-[88%] rounded-[20px] rounded-br-md bg-[var(--foreground)] px-4 py-3 text-sm leading-6 text-[var(--background)] shadow-[0_12px_30px_rgba(0,0,0,0.12)] sm:max-w-[78%]">
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
    <article className="animate-enter max-w-full rounded-[24px] border border-[var(--line)] bg-[var(--panel)] p-4 text-sm leading-7 shadow-sm backdrop-blur sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Sparkles className="size-3.5" />
        </span>
        <div>
          <p className="text-xs font-semibold tracking-[-0.01em]">Context</p>
          <p className="text-[10px] text-[var(--muted)]">Grounded in selected documents</p>
        </div>
      </div>
      <div className="text-[var(--muted-strong)]">
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
      </div>
      <SourceCards messageId={message.id} sources={sources} />
    </article>
  );
}
