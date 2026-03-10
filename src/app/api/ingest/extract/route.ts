import { NextRequest, NextResponse } from "next/server";

// PDF.js for text extraction (works in Node.js via pdfjs-dist)
// For production, consider using a dedicated PDF extraction service

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const mimeType = file.type;
    const filename = file.name;

    // Handle different file types
    if (mimeType === "application/pdf") {
      const text = await extractPdfText(file);
      return NextResponse.json({
        text,
        pageCount: estimatePageCount(text),
        filename,
        type: "pdf",
      });
    }

    if (mimeType === "text/plain" || mimeType === "text/markdown") {
      const text = await file.text();
      return NextResponse.json({
        text,
        pageCount: 1,
        filename,
        type: "text",
      });
    }

    // For slides (PPTX), we'd need a specialized library
    // For MVP, return a placeholder
    if (
      mimeType.includes("presentation") ||
      mimeType.includes("powerpoint") ||
      filename.endsWith(".pptx") ||
      filename.endsWith(".ppt")
    ) {
      return NextResponse.json({
        text: `[Slides: ${filename}]\n\nSlide extraction coming soon. For now, please copy-paste your slide content.`,
        pageCount: 1,
        filename,
        type: "slides",
      });
    }

    return NextResponse.json(
      { error: `Unsupported file type: ${mimeType}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract content" },
      { status: 500 }
    );
  }
}

// Simple PDF text extraction using pdf-parse
// Note: For production, install pdf-parse: npm install pdf-parse
async function extractPdfText(file: File): Promise<string> {
  try {
    // Dynamic import to avoid bundling issues
    const { PDFParse } = await import("pdf-parse");
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const parser = new PDFParse({ data: uint8Array });
    const textResult = await parser.getText();
    return textResult.text || "";
  } catch (error) {
    // Fallback: try basic text extraction
    console.error("pdf-parse failed, using fallback:", error);
    return await fallbackPdfExtraction(file);
  }
}

// Fallback extraction for when pdf-parse isn't available
async function fallbackPdfExtraction(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Very basic PDF text extraction (looks for text streams)
  // This is a simplified approach and won't work for all PDFs
  const text: string[] = [];
  let i = 0;

  while (i < bytes.length - 6) {
    // Look for "stream" keyword
    if (
      bytes[i] === 115 && // s
      bytes[i + 1] === 116 && // t
      bytes[i + 2] === 114 && // r
      bytes[i + 3] === 101 && // e
      bytes[i + 4] === 97 && // a
      bytes[i + 5] === 109 // m
    ) {
      // Skip to after the newline
      i += 6;
      while (i < bytes.length && bytes[i] !== 10 && bytes[i] !== 13) i++;
      i++;

      // Extract text until "endstream"
      const streamStart = i;
      while (i < bytes.length - 9) {
        if (
          bytes[i] === 101 && // e
          bytes[i + 1] === 110 && // n
          bytes[i + 2] === 100 && // d
          bytes[i + 3] === 115 && // s
          bytes[i + 4] === 116 && // t
          bytes[i + 5] === 114 && // r
          bytes[i + 6] === 101 && // e
          bytes[i + 7] === 97 && // a
          bytes[i + 8] === 109 // m
        ) {
          break;
        }
        i++;
      }

      // Try to decode the stream as text
      try {
        const streamBytes = bytes.slice(streamStart, i);
        const decoder = new TextDecoder("utf-8", { fatal: false });
        const decoded = decoder.decode(streamBytes);
        // Filter for printable characters
        const printable = decoded.replace(/[^\x20-\x7E\n\r\t]/g, " ");
        const cleaned = printable.replace(/\s+/g, " ").trim();
        if (cleaned.length > 10) {
          text.push(cleaned);
        }
      } catch {
        // Skip non-text streams
      }
    }
    i++;
  }

  // Also look for text in parentheses (Tj operator)
  const fullText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const tjMatches = fullText.match(/\(([^)]+)\)\s*Tj/g);
  if (tjMatches) {
    tjMatches.forEach((match) => {
      const content = match.slice(1, match.lastIndexOf(")"));
      if (content.length > 1) {
        text.push(content);
      }
    });
  }

  const result = text.join("\n\n").trim();
  return result || "[PDF text extraction failed. Please copy-paste the content manually.]";
}

function estimatePageCount(text: string): number {
  // Rough estimate: ~2000 characters per page
  return Math.max(1, Math.ceil(text.length / 2000));
}
