import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Lazy init to avoid crashing when API key is missing
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openai) {
    openai = new OpenAI();
  }
  return openai;
}

// Tools for agentic PDF extraction
const extractionTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "extract_structured_content",
      description: "Extract and structure content from document text into meaningful blocks",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The main title or subject of the document",
          },
          summary: {
            type: "string",
            description: "A 1-2 sentence summary of the document",
          },
          blocks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["text", "metric", "project", "skill", "experience", "quote", "list", "contact", "education", "achievement"],
                  description: "The type of content block",
                },
                content: {
                  type: "string",
                  description: "The main content text",
                },
                metadata: {
                  type: "object",
                  description: "Additional structured data (dates, numbers, links, etc.)",
                },
              },
              required: ["type", "content"],
            },
            description: "Array of extracted content blocks",
          },
        },
        required: ["title", "summary", "blocks"],
      },
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const useAgentic = formData.get("agentic") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const mimeType = file.type;
    const filename = file.name;

    // Handle different file types
    if (mimeType === "application/pdf") {
      const text = await extractPdfText(file);
      const pageCount = estimatePageCount(text);

      // If agentic mode, use AI to structure the content
      if (useAgentic && text.length > 50) {
        const structured = await agenticExtract(text, filename);
        return NextResponse.json({
          text,
          pageCount,
          filename,
          type: "pdf",
          ...structured,
        });
      }

      return NextResponse.json({
        text,
        pageCount,
        filename,
        type: "pdf",
      });
    }

    if (mimeType === "text/plain" || mimeType === "text/markdown") {
      const text = await file.text();

      if (useAgentic && text.length > 50) {
        const structured = await agenticExtract(text, filename);
        return NextResponse.json({
          text,
          pageCount: 1,
          filename,
          type: "text",
          ...structured,
        });
      }

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

// Agentic extraction using OpenAI
async function agenticExtract(
  text: string,
  filename: string
): Promise<{ title?: string; summary?: string; blocks?: Array<{ type: string; content: string; metadata?: Record<string, unknown> }> }> {
  const client = getOpenAI();
  if (!client) {
    console.warn("OpenAI API key not configured, skipping agentic extraction");
    return {};
  }

  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an expert resume and document analyzer. Extract ALL meaningful content from the document into structured blocks.

IMPORTANT: Be EXHAUSTIVE. Extract EVERY piece of valuable information. Don't summarize - preserve details.

For resumes/portfolios, extract:
1. CONTACT: Full name, email, phone, LinkedIn, GitHub, portfolio URL, location
2. EXPERIENCE: Each job/role with company, title, dates, and ALL bullet points/achievements
3. EDUCATION: Each degree with institution, dates, GPA if mentioned
4. PROJECTS: Each project with name, description, technologies used, and key features
5. SKILLS: ALL technical skills, languages, frameworks, tools mentioned
6. METRICS: Any numbers - ratings, percentages, counts, rankings (e.g., "2187 rating", "550 days", "reduced by 40%")
7. ACHIEVEMENTS: Awards, certifications, competitions (e.g., "ICPC 2023 Regionals", "Guardian badge")

For each block:
- Use the most specific type (experience, project, skill, metric, education, contact, achievement)
- Include ALL details, don't truncate
- For experience/projects: include the full description and all bullet points
- For skills: list each skill as a separate block OR group related skills

Extract 10-30 blocks for comprehensive documents. Quality > brevity.`,
      },
      {
        role: "user",
        content: `Extract ALL structured content from this document. Be thorough and include every detail:\n\n${text.slice(0, 15000)}`,
      },
    ];

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools: extractionTools,
      tool_choice: { type: "function", function: { name: "extract_structured_content" } },
    });

    const message = response.choices[0].message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      if (toolCall.type === "function" && toolCall.function.name === "extract_structured_content") {
        const args = JSON.parse(toolCall.function.arguments);
        return {
          title: args.title,
          summary: args.summary,
          blocks: args.blocks,
        };
      }
    }

    return {};
  } catch (error) {
    console.error("Agentic extraction failed:", error);
    return {};
  }
}

// Simple PDF text extraction using pdf-parse
async function extractPdfText(file: File): Promise<string> {
  try {
    // Dynamic import to avoid bundling issues
    const { PDFParse } = await import("pdf-parse");
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const parser = new PDFParse({ data });
    const textResult = await parser.getText();

    // Combine all page texts
    const fullText = textResult.pages.map((p: { text: string }) => p.text).join("\n\n");
    await parser.destroy();

    return fullText || textResult.text || "";
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
