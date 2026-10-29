import type { UIMessage } from "ai";

export type RetrievedSource = {
  id: number;
  documentId: string;
  fileName: string;
  pageNumber: number;
  snippet: string;
  similarity: number;
};

export type ChatDataParts = {
  sources: {
    query: string;
    sources: RetrievedSource[];
  };
};

export type AppUIMessage = UIMessage<never, ChatDataParts>;
