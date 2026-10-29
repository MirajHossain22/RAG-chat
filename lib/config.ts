export const ragConfig = {
  models: {
    chat: process.env.GOOGLE_CHAT_MODEL ?? "gemini-3.1-flash-lite",
    embedding:
      process.env.GOOGLE_EMBEDDING_MODEL ?? "gemini-embedding-001",
    embeddingDimension: 768,
  },
  chunking: {
    targetTokens: 600,
    overlapTokens: 80,
  },
  retrieval: {
    topK: 6,
    similarityThreshold: 0.54,
  },
  ingestion: {
    embeddingBatchSize: 32,
    maxUploadBytes: 8 * 1024 * 1024,
    maxPages: 250,
    parseTimeoutMs: 30_000,
  },
} as const;

export type RagConfig = typeof ragConfig;
