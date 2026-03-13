// ════════════════════════════════════════════════════════════════════════════
// Slack Webhook Handler
// POST /api/webhooks/slack
// Handles Slack Events API: url_verification, message events
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import type { SuggestedBlock } from "@/types/integration";

// ── Types ────────────────────────────────────────────────────────────────────

interface SlackUrlVerificationEvent {
  type: "url_verification";
  challenge: string;
  token: string;
}

interface SlackEventCallback {
  type: "event_callback";
  token: string;
  team_id: string;
  event: SlackMessageEvent;
  event_id: string;
  event_time: number;
}

interface SlackMessageEvent {
  type: "message";
  subtype?: string;
  channel: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  channel_type?: string;
}

type SlackEvent = SlackUrlVerificationEvent | SlackEventCallback;

// ── Signature Verification ───────────────────────────────────────────────────

function verifySlackSignature(
  signingSecret: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  // Check timestamp to prevent replay attacks (5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp, 10)) > 300) {
    return false;
  }

  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature =
    "v0=" +
    crypto
      .createHmac("sha256", signingSecret)
      .update(sigBasestring)
      .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  );
}

// ── AI Summarization ─────────────────────────────────────────────────────────

async function generateSummary(
  content: string,
  sourceType: "slack"
): Promise<{
  summary: string | null;
  suggestedRoom: string | null;
  suggestedBlock: SuggestedBlock | null;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      summary: content.slice(0, 500),
      suggestedRoom: "research",
      suggestedBlock: {
        type: "text",
        content: content.slice(0, 2000),
      },
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Analyze this Slack message and provide:
1. A brief summary (2-3 sentences)
2. Key decisions or action items (if any)
3. Suggested engagement room (one of: research, meetings, strategy, documents)
4. Relevance score (1-10) for a consulting engagement

Content:
${content.slice(0, 8000)}

Respond in JSON format:
{
  "summary": "...",
  "decisions": ["..."],
  "actionItems": ["..."],
  "suggestedRoom": "meetings|research|strategy|documents",
  "relevanceScore": 8
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const summary = parsed.summary || content.slice(0, 500);
    const suggestedRoom = parsed.suggestedRoom || "research";

    let blockContent = `## Message Summary\n\n${summary}`;

    if (parsed.decisions?.length) {
      blockContent +=
        "\n\n**Decisions:**\n" +
        parsed.decisions.map((d: string) => `- ${d}`).join("\n");
    }

    if (parsed.actionItems?.length) {
      blockContent +=
        "\n\n**Action Items:**\n" +
        parsed.actionItems.map((a: string) => `- ${a}`).join("\n");
    }

    return {
      summary,
      suggestedRoom,
      suggestedBlock: {
        type: parsed.decisions?.length ? "decision" : "text",
        content: blockContent,
        metadata: {
          sourceType,
          relevanceScore: parsed.relevanceScore,
          ingestedAt: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    console.error("AI summarization failed:", error);
    return {
      summary: content.slice(0, 500),
      suggestedRoom: "research",
      suggestedBlock: {
        type: "text",
        content: content.slice(0, 2000),
      },
    };
  }
}

// ── Webhook Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  // Get raw body for signature verification
  const rawBody = await request.text();

  // Verify signature if configured
  if (signingSecret) {
    const signature = request.headers.get("x-slack-signature");
    const timestamp = request.headers.get("x-slack-request-timestamp");

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: "Missing signature headers" },
        { status: 401 }
      );
    }

    if (!verifySlackSignature(signingSecret, signature, timestamp, rawBody)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
  }

  let event: SlackEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Handle URL verification challenge
  if (event.type === "url_verification") {
    return NextResponse.json({ challenge: event.challenge });
  }

  // Handle event callbacks
  if (event.type === "event_callback") {
    const { team_id, event: messageEvent } = event;

    // Only process message events (not subtypes like message_changed)
    if (messageEvent.type !== "message" || messageEvent.subtype) {
      return NextResponse.json({ ok: true });
    }

    const supabase = getDemoAdminClient();
    if (!supabase) {
      console.error("Slack webhook: Database not configured");
      return NextResponse.json({ ok: true }); // Return OK to avoid retries
    }

    // Find matching integration by Slack team ID
    const { data: integrations, error: findError } = await supabase
      .from("engagement_integrations")
      .select("*")
      .eq("integration_type", "slack")
      .eq("is_enabled", true);

    if (findError) {
      console.error("Slack webhook: Failed to find integrations:", findError);
      return NextResponse.json({ ok: true });
    }

    // Find integration matching this team and channel
    const matchingIntegration = integrations?.find((integration) => {
      const settings = integration.settings as {
        slackTeamId?: string;
        slackChannelIds?: string[];
      };
      return (
        settings.slackTeamId === team_id &&
        settings.slackChannelIds?.includes(messageEvent.channel)
      );
    });

    if (!matchingIntegration) {
      // No matching integration found - this is fine, just ignore
      return NextResponse.json({ ok: true });
    }

    // Check if message already exists in queue
    const sourceId = `slack-${messageEvent.ts}`;
    const { data: existing } = await supabase
      .from("ingestion_queue")
      .select("id")
      .eq("integration_id", matchingIntegration.id)
      .eq("source_id", sourceId)
      .single();

    if (existing) {
      return NextResponse.json({ ok: true }); // Already queued
    }

    // Generate AI summary
    const content = `[#${messageEvent.channel}] ${messageEvent.user}: ${messageEvent.text}`;
    const { summary, suggestedRoom, suggestedBlock } = await generateSummary(
      content,
      "slack"
    );

    // Determine status based on auto_ingest setting
    const status = matchingIntegration.auto_ingest ? "auto_ingested" : "pending";

    // Add to ingestion queue
    const { error: insertError } = await supabase.from("ingestion_queue").insert({
      engagement_id: matchingIntegration.engagement_id,
      integration_id: matchingIntegration.id,
      source_type: "slack",
      source_id: sourceId,
      source_data: {
        channelId: messageEvent.channel,
        author: messageEvent.user,
        timestamp: messageEvent.ts,
        threadTs: messageEvent.thread_ts,
        text: messageEvent.text,
      },
      suggested_room: suggestedRoom,
      suggested_block: suggestedBlock,
      summary,
      status,
      processed_at: status === "auto_ingested" ? new Date().toISOString() : null,
    });

    if (insertError) {
      console.error("Slack webhook: Failed to insert queue item:", insertError);
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
