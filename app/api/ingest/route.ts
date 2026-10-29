import { z } from "zod";

import { chunkPages } from "@/lib/chunking";
import { ragConfig } from "@/lib/config";
import { embedDocumentChunks } from "@/lib/embeddings";
import { extractPdfPages, PdfExtractionError } from "@/lib/pdf";
import { rateLimitResponse } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { authenticateRequest } from "@/lib/supabase/request";
import {
  DOCUMENTS_BUCKET,
  ensureDocumentsBucket,
} from "@/lib/supabase/storage";

export const maxDuration = 300;

const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, "The PDF is empty.")
    .refine(
      (file) => file.size <= ragConfig.ingestion.maxUploadBytes,
      "PDFs must be 8 MB or smaller.",
    )
    .refine(
      (file) => file.type === "application/pdf",
      "Only application/pdf files are accepted.",
    )
    .refine(
      (file) => file.name.toLowerCase().endsWith(".pdf"),
      "The file must have a .pdf extension.",
    )
    .refine((file) => file.name.length <= 255, "The file name is too long."),
});

function hasPdfSignature(data: Uint8Array) {
  return (
    data.length >= 5 &&
    data[0] === 0x25 &&
    data[1] === 0x50 &&
    data[2] === 0x44 &&
    data[3] === 0x46 &&
    data[4] === 0x2d
  );
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  const multipartOverheadAllowance = 512 * 1024;

  if (
    Number.isFinite(contentLength) &&
    contentLength > ragConfig.ingestion.maxUploadBytes + multipartOverheadAllowance
  ) {
    return Response.json(
      { error: "PDFs must be 8 MB or smaller." },
      { status: 413 },
    );
  }

  const auth = await authenticateRequest(request);
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimited = await rateLimitResponse("ingest", auth.user.id);
  if (rateLimited) return rateLimited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "The request must be multipart form data." },
      { status: 400 },
    );
  }

  const parsed = uploadSchema.safeParse({ file: formData.get("file") });
  if (!parsed.success) {
    return Response.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid PDF upload.",
        details: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const file = parsed.data.file;
  const fileBytes = new Uint8Array(await file.arrayBuffer());

  if (!hasPdfSignature(fileBytes)) {
    return Response.json(
      { error: "The uploaded file does not contain a valid PDF signature." },
      { status: 400 },
    );
  }

  let storagePath: string | undefined;
  let documentId: string | undefined;

  try {
    const { pages, pageCount } = await extractPdfPages(fileBytes);
    const chunks = chunkPages(pages);

    if (chunks.length === 0) {
      return Response.json(
        { error: "No chunkable text was found in this PDF." },
        { status: 422 },
      );
    }

    const embeddings = await embedDocumentChunks(
      chunks.map((chunk) => chunk.content),
      request.signal,
    );
    const admin = getSupabaseAdmin();

    await ensureDocumentsBucket();
    storagePath = `${auth.user.id}/${crypto.randomUUID()}.pdf`;

    const { error: uploadError } = await admin.storage
      .from(DOCUMENTS_BUCKET)
      .upload(storagePath, fileBytes, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Could not store the PDF: ${uploadError.message}`);
    }

    const { data: document, error: documentError } = await admin
      .from("documents")
      .insert({
        user_id: auth.user.id,
        file_name: file.name,
        storage_path: storagePath,
        page_count: pageCount,
      })
      .select("id, file_name, page_count, created_at")
      .single();

    if (documentError || !document) {
      throw new Error(
        `Could not create the document record: ${documentError?.message ?? "No record returned"}`,
      );
    }

    documentId = document.id;
    const rows = chunks.map((chunk, index) => ({
      document_id: document.id,
      user_id: auth.user.id,
      content: chunk.content,
      page_number: chunk.pageNumber,
      chunk_index: chunk.chunkIndex,
      embedding: embeddings[index],
    }));

    for (let start = 0; start < rows.length; start += 100) {
      const { error: chunksError } = await admin
        .from("chunks")
        .insert(rows.slice(start, start + 100));

      if (chunksError) {
        throw new Error(`Could not save document chunks: ${chunksError.message}`);
      }
    }

    return Response.json(
      {
        document,
        processing: {
          chunks: chunks.length,
          pages: pageCount,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const admin = getSupabaseAdmin();

    if (documentId) {
      await admin.from("documents").delete().eq("id", documentId);
    }
    if (storagePath) {
      await admin.storage.from(DOCUMENTS_BUCKET).remove([storagePath]);
    }

    if (error instanceof PdfExtractionError) {
      return Response.json({ error: error.message }, { status: 422 });
    }

    console.error("PDF ingestion failed", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const isSchemaMissing = /relation .* does not exist/i.test(message);

    return Response.json(
      {
        error: isSchemaMissing
          ? "The Phase 2 database migration has not been applied."
          : "The PDF could not be processed. Please try again.",
      },
      { status: 500 },
    );
  }
}
