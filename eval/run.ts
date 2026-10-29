import { google } from "@ai-sdk/google";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { z } from "zod";

import { chunkPages } from "@/lib/chunking";
import { ragConfig } from "@/lib/config";
import { embedDocumentChunks } from "@/lib/embeddings";
import { extractPdfPages } from "@/lib/pdf";
import {
  buildGroundedInstructions,
  NO_ANSWER_FALLBACK,
} from "@/lib/prompts";
import { retrieveChunks } from "@/lib/retrieval";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createSamplePdf, SAMPLE_FILE_NAME } from "@/eval/sample-report";

const questionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  answerable: z.boolean(),
  expectedPage: z.number().int().positive().nullable(),
  keywords: z.array(z.string().min(1)),
});

const questionsSchema = z.array(questionSchema).min(20);
type EvaluationQuestion = z.infer<typeof questionSchema>;

type EvaluationResult = {
  question: EvaluationQuestion;
  answer: string;
  topPage?: number;
  topSimilarity?: number;
  retrievalHit: boolean | null;
  answerCorrect: boolean | null;
  keywordScore: number | null;
  refused: boolean;
  refusalCorrect: boolean | null;
  latencyMs: number;
  error?: string;
};

function requiredEnvironment(name: string) {
  const value = process.env[name];
  if (!value || value.startsWith("your_")) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalized(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => (word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word))
    .join(" ");
}

function scoreKeywords(answer: string, keywords: string[]) {
  if (keywords.length === 0) return 0;
  const comparableAnswer = normalized(answer);
  const matches = keywords.filter((keyword) =>
    comparableAnswer.includes(normalized(keyword)),
  ).length;
  return matches / keywords.length;
}

function escapeTable(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function percentage(numerator: number, denominator: number) {
  return denominator === 0 ? "n/a" : `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function parseLimit() {
  const argument = process.argv.find((value) => value.startsWith("--limit="));
  if (!argument) return undefined;
  const value = Number(argument.slice("--limit=".length));
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("--limit must be a positive integer.");
  }
  return value;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function createEvaluationUser() {
  const admin = getSupabaseAdmin();
  const email = `rag-eval-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@example.com`;
  const password = `${crypto.randomUUID()}Aa1!`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Could not create evaluation user: ${error?.message ?? "No user returned"}`);
  }

  const supabase = createClient(
    requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    await admin.auth.admin.deleteUser(data.user.id);
    throw new Error(`Could not sign in evaluation user: ${signInError.message}`);
  }

  return { userId: data.user.id, supabase };
}

async function ingestSample(userId: string) {
  const pdfBytes = await createSamplePdf();
  const samplePath = new URL("./sample-report.pdf", import.meta.url);
  await writeFile(samplePath, pdfBytes);

  const { pages, pageCount } = await extractPdfPages(pdfBytes);
  const chunks = chunkPages(pages);
  const embeddings = await embedDocumentChunks(
    chunks.map((chunk) => chunk.content),
  );
  const admin = getSupabaseAdmin();
  const storagePath = `evaluation/${crypto.randomUUID()}.pdf`;
  const { data: document, error: documentError } = await admin
    .from("documents")
    .insert({
      user_id: userId,
      file_name: SAMPLE_FILE_NAME,
      storage_path: storagePath,
      page_count: pageCount,
    })
    .select("id")
    .single();

  if (documentError || !document) {
    throw new Error(
      `Could not create evaluation document: ${documentError?.message ?? "No document returned"}`,
    );
  }

  const rows = chunks.map((chunk, index) => ({
    document_id: document.id,
    user_id: userId,
    content: chunk.content,
    page_number: chunk.pageNumber,
    chunk_index: chunk.chunkIndex,
    embedding: embeddings[index],
  }));
  const { error: chunksError } = await admin.from("chunks").insert(rows);

  if (chunksError) {
    await admin.from("documents").delete().eq("id", document.id);
    throw new Error(`Could not save evaluation chunks: ${chunksError.message}`);
  }

  return { documentId: document.id, pageCount, chunkCount: chunks.length };
}

async function evaluateQuestion(
  supabase: SupabaseClient,
  documentId: string,
  question: EvaluationQuestion,
): Promise<EvaluationResult> {
  const startedAt = performance.now();

  try {
    const chunks = await retrieveChunks(supabase, question.question, [documentId]);
    const topChunk = chunks[0];
    const hasRelevantContext =
      Boolean(topChunk) &&
      topChunk.similarity >= ragConfig.retrieval.similarityThreshold;
    let answer = NO_ANSWER_FALLBACK;

    if (hasRelevantContext) {
      const generated = await generateText({
        model: google(ragConfig.models.chat),
        instructions: buildGroundedInstructions(chunks),
        prompt: question.question,
        temperature: 0,
        maxOutputTokens: 450,
      });
      answer = generated.text.trim();
    }

    const refused = answer === NO_ANSWER_FALLBACK;
    const keywordScore = question.answerable
      ? scoreKeywords(answer, question.keywords)
      : null;

    return {
      question,
      answer,
      topPage: topChunk?.pageNumber,
      topSimilarity: topChunk?.similarity,
      retrievalHit: question.answerable
        ? topChunk?.pageNumber === question.expectedPage
        : null,
      answerCorrect: question.answerable
        ? !refused && (keywordScore ?? 0) >= 0.6
        : null,
      keywordScore,
      refused,
      refusalCorrect: question.answerable ? null : refused,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch (error) {
    return {
      question,
      answer: "Evaluation case failed.",
      retrievalHit: question.answerable ? false : null,
      answerCorrect: question.answerable ? false : null,
      keywordScore: question.answerable ? 0 : null,
      refused: false,
      refusalCorrect: question.answerable ? null : false,
      latencyMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : "Unknown evaluation error",
    };
  }
}

function buildReport(
  results: EvaluationResult[],
  metadata: { pageCount: number; chunkCount: number },
) {
  const answerable = results.filter((result) => result.question.answerable);
  const unanswerable = results.filter((result) => !result.question.answerable);
  const retrievalHits = answerable.filter((result) => result.retrievalHit).length;
  const correctAnswers = answerable.filter((result) => result.answerCorrect).length;
  const correctRefusals = unanswerable.filter(
    (result) => result.refusalCorrect,
  ).length;
  const averageLatency =
    results.reduce((sum, result) => sum + result.latencyMs, 0) /
    Math.max(results.length, 1);
  const failures = results.filter((result) => result.error).length;

  const summaryRows = [
    `| Top-1 retrieval hit rate | ${percentage(retrievalHits, answerable.length)} (${retrievalHits}/${answerable.length}) |`,
    `| Answer correctness (keyword) | ${percentage(correctAnswers, answerable.length)} (${correctAnswers}/${answerable.length}) |`,
    `| Refusal accuracy | ${percentage(correctRefusals, unanswerable.length)} (${correctRefusals}/${unanswerable.length}) |`,
    `| Average latency | ${averageLatency.toFixed(0)} ms |`,
    `| Failed cases | ${failures} |`,
  ];
  const caseRows = results.map((result) => {
    const outcome = result.question.answerable
      ? result.answerCorrect
        ? "PASS"
        : "FAIL"
      : result.refusalCorrect
        ? "PASS"
        : "FAIL";
    return `| ${result.question.id} | ${result.question.answerable ? "Yes" : "No"} | ${result.question.expectedPage ?? "-"} | ${result.topPage ?? "-"} | ${result.topSimilarity?.toFixed(3) ?? "-"} | ${result.retrievalHit === null ? "-" : result.retrievalHit ? "Yes" : "No"} | ${outcome} | ${result.latencyMs} |`;
  });
  const details = results
    .map(
      (result) => `### ${result.question.id}: ${result.question.question}

- Expected: ${result.question.answer}
- Actual: ${escapeTable(result.answer)}
- Expected page: ${result.question.expectedPage ?? "unanswerable"}
- Retrieved top page: ${result.topPage ?? "none"}
${result.error ? `- Error: ${escapeTable(result.error)}\n` : ""}`,
    )
    .join("\n");

  return `# RAG Evaluation Results

Generated: ${new Date().toISOString()}

## Configuration

- Sample: \`${SAMPLE_FILE_NAME}\` (${metadata.pageCount} pages, ${metadata.chunkCount} chunks)
- Questions evaluated: ${results.length}
- Chat model: \`${ragConfig.models.chat}\`
- Embedding model: \`${ragConfig.models.embedding}\` (${ragConfig.models.embeddingDimension} dimensions)
- Retrieval: top ${ragConfig.retrieval.topK}, cosine threshold ${ragConfig.retrieval.similarityThreshold}
- Correctness rule: at least 60% of expected keywords must appear
- Retrieval rule: the expected page must rank first

## Summary

| Metric | Result |
| --- | ---: |
${summaryRows.join("\n")}

## Per-question results

| ID | Answerable | Expected page | Top page | Similarity | Retrieval hit | Outcome | Latency ms |
| --- | --- | ---: | ---: | ---: | --- | --- | ---: |
${caseRows.join("\n")}

## Answer details

${details}
`;
}

async function main() {
  requiredEnvironment("GOOGLE_GENERATIVE_AI_API_KEY");
  requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL");
  requiredEnvironment("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");

  const rawQuestions = await readFile(
    new URL("./questions.json", import.meta.url),
    "utf8",
  );
  const allQuestions = questionsSchema.parse(JSON.parse(rawQuestions));
  const limit = parseLimit();
  const questions = limit ? allQuestions.slice(0, limit) : allQuestions;
  const admin = getSupabaseAdmin();
  let userId: string | undefined;
  let documentId: string | undefined;

  try {
    console.log("Creating isolated evaluation user...");
    const evaluationUser = await createEvaluationUser();
    userId = evaluationUser.userId;

    console.log("Generating and ingesting sample PDF...");
    const sample = await ingestSample(userId);
    documentId = sample.documentId;
    console.log(
      `Evaluating ${questions.length} questions with ${sample.chunkCount} chunks...`,
    );

    const results: EvaluationResult[] = [];
    for (const [index, question] of questions.entries()) {
      const result = await evaluateQuestion(
        evaluationUser.supabase,
        sample.documentId,
        question,
      );
      results.push(result);
      console.log(
        `[${index + 1}/${questions.length}] ${question.id}: ${result.error ? "ERROR" : question.answerable ? (result.answerCorrect ? "PASS" : "FAIL") : result.refusalCorrect ? "PASS" : "FAIL"} (${result.latencyMs} ms)`,
      );
      if (index < questions.length - 1) {
        // Gemini's free tier allows 15 generate requests per minute.
        await wait(4_250);
      }
    }

    const report = buildReport(results, sample);
    await mkdir(new URL(".", import.meta.url), { recursive: true });
    await writeFile(new URL("./results.md", import.meta.url), report, "utf8");

    const answerable = results.filter((result) => result.question.answerable);
    const unanswerable = results.filter(
      (result) => !result.question.answerable,
    );
    console.table({
      "Retrieval hit rate": percentage(
        answerable.filter((result) => result.retrievalHit).length,
        answerable.length,
      ),
      "Answer correctness": percentage(
        answerable.filter((result) => result.answerCorrect).length,
        answerable.length,
      ),
      "Refusal accuracy": percentage(
        unanswerable.filter((result) => result.refusalCorrect).length,
        unanswerable.length,
      ),
      "Average latency": `${Math.round(results.reduce((sum, result) => sum + result.latencyMs, 0) / results.length)} ms`,
    });
    console.log("Saved eval/results.md and eval/sample-report.pdf");
  } finally {
    if (documentId) {
      await admin.from("documents").delete().eq("id", documentId);
    }
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
    console.log("Removed temporary evaluation data.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
