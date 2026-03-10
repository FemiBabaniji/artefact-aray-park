import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { content, targetType } = await req.json();

    if (!content) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const systemPrompt = `You are a content parser that extracts structured information from documents.
Your job is to analyze the provided text and extract relevant blocks of content.

For each block, identify:
- type: "text" | "metric" | "project" | "skill" | "experience"
- content: the actual content text
- metadata: any relevant structured data (dates, numbers, etc.)

Focus on extracting:
- Key achievements and metrics (numbers, percentages, growth)
- Projects with descriptions
- Skills and technologies
- Work experiences with dates
- Important text passages

Return a JSON object with:
{
  "summary": "1-2 sentence summary of the content",
  "blocks": [
    { "type": "...", "content": "...", "metadata": {...} }
  ]
}

Be concise but preserve important details. Extract 3-8 most relevant blocks.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Parse this content and extract structured blocks:\n\n${content.slice(0, 8000)}`,
        },
      ],
      system: systemPrompt,
    });

    // Extract text from response
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      summary: parsed.summary || "Extracted content",
      blocks: parsed.blocks || [],
    });
  } catch (error) {
    console.error("Parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse content" },
      { status: 500 }
    );
  }
}
