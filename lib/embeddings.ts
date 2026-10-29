import "server-only";

import { google, type GoogleEmbeddingModelOptions } from "@ai-sdk/google";
import { embedMany } from "ai";

import { ragConfig } from "@/lib/config";

export async function embedDocumentChunks(
  values: string[],
  abortSignal?: AbortSignal,
) {
  const embeddings: number[][] = [];
  const batchSize = ragConfig.ingestion.embeddingBatchSize;

  for (let start = 0; start < values.length; start += batchSize) {
    const batch = values.slice(start, start + batchSize);
    const result = await embedMany({
      model: google.embedding(ragConfig.models.embedding),
      values: batch,
      abortSignal,
      providerOptions: {
        google: {
          outputDimensionality: ragConfig.models.embeddingDimension,
          taskType: "RETRIEVAL_DOCUMENT",
        } satisfies GoogleEmbeddingModelOptions,
      },
    });

    embeddings.push(...result.embeddings);
  }

  const invalidEmbedding = embeddings.find(
    (embedding) => embedding.length !== ragConfig.models.embeddingDimension,
  );

  if (invalidEmbedding) {
    throw new Error(
      `Embedding dimension mismatch: expected ${ragConfig.models.embeddingDimension}, received ${invalidEmbedding.length}.`,
    );
  }

  return embeddings;
}
