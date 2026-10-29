import "server-only";

import { google, type GoogleEmbeddingModelOptions } from "@ai-sdk/google";
import type { SupabaseClient } from "@supabase/supabase-js";
import { embed } from "ai";
import { z } from "zod";

import type { RetrievedSource } from "@/lib/chat-types";
import { ragConfig } from "@/lib/config";

const matchSchema = z.array(
  z.object({
    content: z.string(),
    page_number: z.number().int().positive(),
    document_id: z.uuid(),
    file_name: z.string(),
    similarity: z.number(),
  }),
);

export type RetrievedChunk = RetrievedSource & { content: string };

function createSnippet(content: string, maximumLength = 240) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maximumLength) return normalized;

  const shortened = normalized.slice(0, maximumLength);
  const wordBoundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, wordBoundary > 160 ? wordBoundary : maximumLength)}…`;
}

export async function retrieveChunks(
  supabase: SupabaseClient,
  query: string,
  documentIds: string[],
  abortSignal?: AbortSignal,
) {
  const { embedding } = await embed({
    model: google.embedding(ragConfig.models.embedding),
    value: query,
    abortSignal,
    providerOptions: {
      google: {
        outputDimensionality: ragConfig.models.embeddingDimension,
        taskType: "RETRIEVAL_QUERY",
      } satisfies GoogleEmbeddingModelOptions,
    },
  });

  if (embedding.length !== ragConfig.models.embeddingDimension) {
    throw new Error(
      `Query embedding dimension mismatch: expected ${ragConfig.models.embeddingDimension}, received ${embedding.length}.`,
    );
  }

  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    match_count: ragConfig.retrieval.topK,
    filter_document_ids: documentIds.length > 0 ? documentIds : null,
  });

  if (error) {
    throw new Error(`Chunk retrieval failed: ${error.message}`);
  }

  return matchSchema.parse(data ?? []).map(
    (match, index): RetrievedChunk => ({
      id: index + 1,
      documentId: match.document_id,
      fileName: match.file_name,
      pageNumber: match.page_number,
      content: match.content,
      snippet: createSnippet(match.content),
      similarity: match.similarity,
    }),
  );
}
