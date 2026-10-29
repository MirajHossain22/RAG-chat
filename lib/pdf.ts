import "server-only";

import { extractText, getDocumentProxy } from "unpdf";

import { ragConfig } from "@/lib/config";

export class PdfExtractionError extends Error {}

function withTimeout<T>(promise: Promise<T>, milliseconds: number) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new PdfExtractionError("PDF processing timed out.")),
      milliseconds,
    );

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

export async function extractPdfPages(data: Uint8Array) {
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>> | undefined;

  try {
    pdf = await withTimeout(
      getDocumentProxy(data, {
        maxImageSize: 16_777_216,
      }),
      ragConfig.ingestion.parseTimeoutMs,
    );

    if (pdf.numPages > ragConfig.ingestion.maxPages) {
      throw new PdfExtractionError(
        `This PDF has ${pdf.numPages} pages. The current limit is ${ragConfig.ingestion.maxPages}.`,
      );
    }

    const result = await withTimeout(
      extractText(pdf, { mergePages: false }),
      ragConfig.ingestion.parseTimeoutMs,
    );
    const meaningfulText = result.text.join(" ").replace(/\s+/g, " ").trim();

    if (meaningfulText.length === 0) {
      throw new PdfExtractionError(
        "No readable text was found. The PDF may be scanned or image-only.",
      );
    }

    return { pages: result.text, pageCount: result.totalPages };
  } catch (error) {
    if (error instanceof PdfExtractionError) throw error;

    const message = error instanceof Error ? error.message : "Unknown PDF error";
    throw new PdfExtractionError(`The PDF could not be read: ${message}`);
  } finally {
    await pdf?.cleanup();
  }
}
