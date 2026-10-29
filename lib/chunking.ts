import { ragConfig } from "@/lib/config";

export type DocumentChunk = {
  content: string;
  pageNumber: number;
  chunkIndex: number;
};

function normalizeText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findBoundary(text: string, desiredEnd: number, minimumEnd: number) {
  if (desiredEnd >= text.length) return text.length;

  const paragraphBreak = text.lastIndexOf("\n\n", desiredEnd);
  if (paragraphBreak >= minimumEnd) return paragraphBreak;

  const sentenceBreak = Math.max(
    text.lastIndexOf(". ", desiredEnd),
    text.lastIndexOf("? ", desiredEnd),
    text.lastIndexOf("! ", desiredEnd),
  );
  if (sentenceBreak >= minimumEnd) return sentenceBreak + 1;

  const wordBreak = text.lastIndexOf(" ", desiredEnd);
  return wordBreak >= minimumEnd ? wordBreak : desiredEnd;
}

export function chunkPages(pages: string[]) {
  const targetCharacters = ragConfig.chunking.targetTokens * 4;
  const overlapCharacters = ragConfig.chunking.overlapTokens * 4;
  const chunks: DocumentChunk[] = [];

  pages.forEach((page, pageIndex) => {
    const text = normalizeText(page);
    let start = 0;

    while (start < text.length) {
      const desiredEnd = Math.min(start + targetCharacters, text.length);
      const minimumEnd = Math.min(
        start + Math.floor(targetCharacters * 0.65),
        desiredEnd,
      );
      const end = findBoundary(text, desiredEnd, minimumEnd);
      const content = text.slice(start, end).trim();

      if (content) {
        chunks.push({
          content,
          pageNumber: pageIndex + 1,
          chunkIndex: chunks.length,
        });
      }

      if (end >= text.length) break;

      const proposedStart = Math.max(end - overlapCharacters, start + 1);
      const nextWord = text.indexOf(" ", proposedStart);
      start = nextWord === -1 || nextWord >= end ? proposedStart : nextWord + 1;
    }
  });

  return chunks;
}
