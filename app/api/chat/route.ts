import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";

import type { AppUIMessage } from "@/lib/chat-types";
import { ragConfig } from "@/lib/config";
import {
  buildGroundedInstructions,
  getLatestUserQuestion,
  NO_ANSWER_FALLBACK,
  rewriteRetrievalQuery,
} from "@/lib/prompts";
import { rateLimitResponse } from "@/lib/rate-limit";
import { retrieveChunks } from "@/lib/retrieval";
import { authenticateRequest } from "@/lib/supabase/request";

export const maxDuration = 120;

const messagePartSchema = z
  .object({
    type: z.string().min(1),
    text: z.string().max(12_000).optional(),
  })
  .catchall(z.unknown());

const requestSchema = z.object({
  messages: z
    .array(
      z
        .object({
          id: z.string().min(1).max(200),
          role: z.enum(["user", "assistant", "system"]),
          parts: z.array(messagePartSchema).min(1).max(50),
        })
        .catchall(z.unknown()),
    )
    .min(1)
    .max(50),
  selectedDocumentIds: z.array(z.uuid()).max(50).default([]),
});

function formatStreamError(error: unknown) {
  console.error("Chat stream failed", error);

  const message = error instanceof Error ? error.message : "";

  if (/api key|unauthorized|401|403/i.test(message)) {
    return "The Gemini API key was rejected. Check GOOGLE_GENERATIVE_AI_API_KEY and restart the server.";
  }
  if (/quota|rate limit|429/i.test(message)) {
    return "The Gemini API quota has been reached. Please wait and try again.";
  }
  if (/model.*(not found|no longer available)/i.test(message)) {
    return "The configured Gemini model is unavailable. Check GOOGLE_CHAT_MODEL in .env.local.";
  }

  return "The grounded response could not be generated. Please try again.";
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (JSON.stringify(body).length > 200_000) {
    return Response.json(
      { error: "Chat request is too large." },
      { status: 413 },
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid chat request.",
        details: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const auth = await authenticateRequest(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimited = await rateLimitResponse("chat", auth.user.id);
  if (rateLimited) return rateLimited;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return Response.json(
      {
        error:
          "The chat provider is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY to your environment.",
      },
      { status: 503 },
    );
  }

  const messages = parsed.data.messages as AppUIMessage[];
  const question = getLatestUserQuestion(messages as UIMessage[]);

  if (!question) {
    return Response.json(
      { error: "A user question is required." },
      { status: 400 },
    );
  }

  try {
    const retrievalQuery = await rewriteRetrievalQuery(
      messages as UIMessage[],
      question,
      request.signal,
    );
    const chunks = await retrieveChunks(
      auth.supabase,
      retrievalQuery,
      parsed.data.selectedDocumentIds,
      request.signal,
    );
    const hasRelevantContext =
      chunks.length > 0 &&
      chunks[0].similarity >= ragConfig.retrieval.similarityThreshold;
    const answerChunks = hasRelevantContext ? chunks : [];
    const sources = answerChunks.map((chunk) => ({
      id: chunk.id,
      documentId: chunk.documentId,
      fileName: chunk.fileName,
      pageNumber: chunk.pageNumber,
      snippet: chunk.snippet,
      similarity: chunk.similarity,
    }));

    const stream = createUIMessageStream<AppUIMessage>({
      originalMessages: messages,
      onError: formatStreamError,
      execute: async ({ writer }) => {
        writer.write({
          type: "data-sources",
          id: "retrieved-sources",
          data: { query: retrievalQuery, sources },
        });

        if (!hasRelevantContext) {
          const textId = crypto.randomUUID();
          writer.write({ type: "text-start", id: textId });
          writer.write({
            type: "text-delta",
            id: textId,
            delta: NO_ANSWER_FALLBACK,
          });
          writer.write({ type: "text-end", id: textId });
          writer.setOutcome({ status: "completed" });
          return;
        }

        const result = streamText({
          model: google(ragConfig.models.chat),
          instructions: buildGroundedInstructions(answerChunks),
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
        });

        writer.merge(result.toUIMessageStream());
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("Grounded chat preparation failed", error);
    return Response.json(
      { error: "Document retrieval failed. Please try again." },
      { status: 502 },
    );
  }
}
