import { extractText, renderPageAsImage } from "unpdf";

export interface ExtractionResult {
  text: string;
  pageCount: number;
}

/**
 * Extract text from a PDF buffer using unpdf (serverless-friendly)
 * Simple, direct text extraction - no AI/vision/scanning
 */
export async function extractPdfText(
  buffer: ArrayBuffer
): Promise<ExtractionResult> {
  const result = await extractText(buffer, { mergePages: true });
  const text = Array.isArray(result.text) ? result.text.join("\n") : String(result.text);

  return {
    text,
    pageCount: result.totalPages || 1,
  };
}

/**
 * Generate a thumbnail image of the first page
 * Returns an ArrayBuffer or null if generation fails
 */
export async function generateThumbnail(
  buffer: ArrayBuffer,
  scale = 0.5
): Promise<ArrayBuffer | null> {
  try {
    const image = await renderPageAsImage(buffer, 1, { scale });
    return image;
  } catch (error) {
    console.error("Failed to generate thumbnail:", error);
    return null;
  }
}
