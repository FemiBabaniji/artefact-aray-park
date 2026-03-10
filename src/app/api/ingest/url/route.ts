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

// Tools for the agentic extraction
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "fetch_webpage",
      description: "Fetch the content of a webpage given its URL",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to fetch",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "extract_structured_content",
      description:
        "Extract and structure content from raw HTML/text into meaningful blocks",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "The main title of the content",
          },
          summary: {
            type: "string",
            description: "A 1-2 sentence summary of the content",
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

// Tool execution functions
async function fetchWebpage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ArtefactBot/1.0; +http://localhost:3000)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return `Error: Failed to fetch URL (${res.status} ${res.statusText})`;
    }

    const html = await res.text();

    // Basic HTML to text conversion
    const text = html
      // Remove scripts and styles
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      // Convert common block elements to newlines
      .replace(/<\/(p|div|h[1-6]|li|tr|br)[^>]*>/gi, "\n")
      .replace(/<(br|hr)[^>]*\/?>/gi, "\n")
      // Remove remaining tags
      .replace(/<[^>]+>/g, " ")
      // Decode HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, " ")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // Limit content size for the model
    return text.slice(0, 15000);
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : "Failed to fetch URL"}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Check for OpenAI API key
    const client = getOpenAI();
    if (!client) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Start the agentic loop
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are an expert content extraction agent. Your task is to:
1. Fetch the webpage content using the fetch_webpage tool
2. Analyze the content and extract ALL meaningful, structured blocks
3. Use extract_structured_content to return the final structured data

IMPORTANT: Be EXHAUSTIVE. Extract EVERY piece of valuable information.

For portfolios/resumes, extract:
- CONTACT: Name, email, phone, LinkedIn, GitHub, location
- EXPERIENCE: Each job with company, title, dates, ALL achievements
- EDUCATION: Each degree with institution, dates
- PROJECTS: Each project with description, tech stack, features
- SKILLS: ALL technical skills, languages, frameworks
- METRICS: Any numbers - ratings, percentages, rankings
- ACHIEVEMENTS: Awards, certifications, competitions

Extract 10-30 blocks for comprehensive pages. Include ALL details.`,
      },
      {
        role: "user",
        content: `Extract ALL structured content from this URL. Be thorough: ${url}`,
      },
    ];

    let extractedContent = null;
    let iterations = 0;
    const maxIterations = 5;

    // Agentic loop - let the model decide what tools to use
    while (iterations < maxIterations) {
      iterations++;

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages,
        tools,
        tool_choice: extractedContent ? "none" : "auto",
      });

      const message = response.choices[0].message;
      messages.push(message);

      // Check if we're done
      if (!message.tool_calls || message.tool_calls.length === 0) {
        break;
      }

      // Execute tool calls
      for (const toolCall of message.tool_calls) {
        // Only handle function tool calls
        if (toolCall.type !== "function") continue;

        const args = JSON.parse(toolCall.function.arguments);
        let result: string;

        switch (toolCall.function.name) {
          case "fetch_webpage":
            result = await fetchWebpage(args.url);
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            });
            break;

          case "extract_structured_content":
            // This is our final extraction - capture it
            extractedContent = args;
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: "Content extracted successfully",
            });
            break;

          default:
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Unknown tool: ${toolCall.function.name}`,
            });
        }
      }

      // If we got extracted content, we're done
      if (extractedContent) {
        break;
      }
    }

    if (!extractedContent) {
      return NextResponse.json(
        { error: "Failed to extract content from URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url,
      title: extractedContent.title,
      summary: extractedContent.summary,
      blocks: extractedContent.blocks || [],
    });
  } catch (error) {
    console.error("URL extraction error:", error);
    return NextResponse.json(
      { error: "Failed to process URL" },
      { status: 500 }
    );
  }
}
