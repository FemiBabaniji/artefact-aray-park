// ════════════════════════════════════════════════════════════════════════════
// Zoom Webhook Handler
// POST /api/webhooks/zoom
// Handles Zoom webhook events: recording.completed, etc.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getDemoAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import type { SuggestedBlock } from "@/types/integration";

// ── Types ────────────────────────────────────────────────────────────────────

interface ZoomWebhookEvent {
  event: string;
  event_ts: number;
  payload: {
    account_id: string;
    object: ZoomRecordingObject | ZoomMeetingObject;
  };
}

interface ZoomRecordingObject {
  id: string;
  uuid: string;
  host_id: string;
  host_email?: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone?: string;
  total_size?: number;
  recording_count?: number;
  share_url?: string;
  recording_files?: ZoomRecordingFile[];
  participant_audio_files?: Array<{ download_url: string }>;
}

interface ZoomRecordingFile {
  id: string;
  meeting_id: string;
  recording_start: string;
  recording_end: string;
  file_type: string; // MP4, M4A, CHAT, TRANSCRIPT, etc.
  file_size?: number;
  download_url?: string;
  play_url?: string;
  status: string;
  recording_type: string;
}

interface ZoomMeetingObject {
  id: string;
  uuid: string;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
}

// Zoom URL verification challenge
interface ZoomUrlValidationEvent {
  event: "endpoint.url_validation";
  payload: {
    plainToken: string;
  };
}

// ── Signature Verification ───────────────────────────────────────────────────

function verifyZoomSignature(
  webhookSecret: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  const message = `v0:${timestamp}:${body}`;
  const expectedSignature =
    "v0=" +
    crypto.createHmac("sha256", webhookSecret).update(message).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

// ── Fetch Transcript ─────────────────────────────────────────────────────────

async function fetchTranscript(
  transcriptUrl: string,
  accessToken?: string
): Promise<string | null> {
  try {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch(transcriptUrl, { headers });
    if (!response.ok) {
      console.error("Failed to fetch transcript:", response.status);
      return null;
    }

    const text = await response.text();
    return text;
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return null;
  }
}

// ── AI Summarization ─────────────────────────────────────────────────────────

async function generateMeetingSummary(
  topic: string,
  duration: number,
  transcript: string | null,
  startTime: string
): Promise<{
  summary: string | null;
  suggestedRoom: string | null;
  suggestedBlock: SuggestedBlock | null;
}> {
  const content = transcript
    ? `Meeting: ${topic}\nDate: ${startTime}\nDuration: ${duration} minutes\n\nTranscript:\n${transcript}`
    : `Meeting: ${topic}\nDate: ${startTime}\nDuration: ${duration} minutes`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      summary: `Meeting "${topic}" (${duration} minutes)`,
      suggestedRoom: "meetings",
      suggestedBlock: {
        type: "text",
        content: content.slice(0, 2000),
      },
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const prompt = `Analyze this meeting recording and provide:
1. A brief summary (2-3 sentences)
2. Key decisions made (if any)
3. Action items (if any)
4. Suggested engagement room (one of: research, meetings, strategy, documents)
5. Relevance score (1-10) for a consulting engagement

Meeting Details:
Topic: ${topic}
Date: ${startTime}
Duration: ${duration} minutes
${transcript ? `\nTranscript:\n${transcript.slice(0, 8000)}` : "\n(No transcript available)"}

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
    const summary = parsed.summary || `Meeting "${topic}" (${duration} minutes)`;
    const suggestedRoom = parsed.suggestedRoom || "meetings";

    let blockContent = `## Meeting Notes: ${topic}\n\n**Date:** ${startTime}\n**Duration:** ${duration} minutes\n\n${summary}`;

    if (parsed.decisions?.length) {
      blockContent +=
        "\n\n### Decisions\n" +
        parsed.decisions.map((d: string) => `- ${d}`).join("\n");
    }

    if (parsed.actionItems?.length) {
      blockContent +=
        "\n\n### Action Items\n" +
        parsed.actionItems.map((a: string) => `- ${a}`).join("\n");
    }

    return {
      summary,
      suggestedRoom,
      suggestedBlock: {
        type: "decision",
        content: blockContent,
        metadata: {
          sourceType: "meeting",
          meetingTopic: topic,
          duration,
          relevanceScore: parsed.relevanceScore,
          ingestedAt: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    console.error("AI summarization failed:", error);
    return {
      summary: `Meeting "${topic}" (${duration} minutes)`,
      suggestedRoom: "meetings",
      suggestedBlock: {
        type: "text",
        content: content.slice(0, 2000),
      },
    };
  }
}

// ── Webhook Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.ZOOM_WEBHOOK_SECRET;

  // Get raw body for signature verification
  const rawBody = await request.text();

  let payload: ZoomWebhookEvent | ZoomUrlValidationEvent;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Handle URL validation challenge (Zoom requires this for webhook setup)
  if (payload.event === "endpoint.url_validation") {
    const urlValidation = payload as ZoomUrlValidationEvent;
    const plainToken = urlValidation.payload.plainToken;

    // Generate encrypted token
    const encryptedToken = crypto
      .createHmac("sha256", webhookSecret || "")
      .update(plainToken)
      .digest("hex");

    return NextResponse.json({
      plainToken,
      encryptedToken,
    });
  }

  // Verify signature if configured
  if (webhookSecret) {
    const signature = request.headers.get("x-zm-signature");
    const timestamp = request.headers.get("x-zm-request-timestamp");

    if (!signature || !timestamp) {
      return NextResponse.json(
        { error: "Missing signature headers" },
        { status: 401 }
      );
    }

    if (!verifyZoomSignature(webhookSecret, signature, timestamp, rawBody)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
  }

  const event = payload as ZoomWebhookEvent;

  // Handle recording.completed event
  if (event.event === "recording.completed") {
    const recording = event.payload.object as ZoomRecordingObject;
    const accountId = event.payload.account_id;

    const supabase = getDemoAdminClient();
    if (!supabase) {
      console.error("Zoom webhook: Database not configured");
      return NextResponse.json({ ok: true });
    }

    // Find matching integration by Zoom account ID
    const { data: integrations, error: findError } = await supabase
      .from("engagement_integrations")
      .select("*")
      .or("integration_type.eq.zoom,integration_type.eq.meeting,integration_type.eq.meetings")
      .eq("is_enabled", true);

    if (findError) {
      console.error("Zoom webhook: Failed to find integrations:", findError);
      return NextResponse.json({ ok: true });
    }

    // Find integration matching this account
    const matchingIntegration = integrations?.find((integration) => {
      const settings = integration.settings as {
        zoomAccountId?: string;
        zoomUserId?: string;
      };
      return (
        settings.zoomAccountId === accountId ||
        settings.zoomUserId === recording.host_id
      );
    });

    if (!matchingIntegration) {
      return NextResponse.json({ ok: true }); // No matching integration
    }

    // Check if recording already exists in queue
    const sourceId = `zoom-${recording.uuid || recording.id}`;
    const { data: existing } = await supabase
      .from("ingestion_queue")
      .select("id")
      .eq("integration_id", matchingIntegration.id)
      .eq("source_id", sourceId)
      .single();

    if (existing) {
      return NextResponse.json({ ok: true }); // Already queued
    }

    // Find transcript file if available
    const transcriptFile = recording.recording_files?.find(
      (f) => f.file_type === "TRANSCRIPT" && f.download_url
    );

    // Fetch transcript if available
    let transcript: string | null = null;
    if (transcriptFile?.download_url) {
      // Note: You may need to add access token for authenticated downloads
      transcript = await fetchTranscript(transcriptFile.download_url);
    }

    // Generate AI summary
    const { summary, suggestedRoom, suggestedBlock } = await generateMeetingSummary(
      recording.topic,
      recording.duration,
      transcript,
      recording.start_time
    );

    // Determine status
    const status = matchingIntegration.auto_ingest ? "auto_ingested" : "pending";

    // Add to ingestion queue
    const { error: insertError } = await supabase.from("ingestion_queue").insert({
      engagement_id: matchingIntegration.engagement_id,
      integration_id: matchingIntegration.id,
      source_type: "meeting",
      source_id: sourceId,
      source_data: {
        meetingId: recording.id,
        uuid: recording.uuid,
        topic: recording.topic,
        hostId: recording.host_id,
        hostEmail: recording.host_email,
        startTime: recording.start_time,
        duration: recording.duration,
        shareUrl: recording.share_url,
        hasTranscript: !!transcript,
        recordingFiles: recording.recording_files?.map((f) => ({
          id: f.id,
          fileType: f.file_type,
          recordingType: f.recording_type,
          downloadUrl: f.download_url,
          playUrl: f.play_url,
        })),
      },
      suggested_room: suggestedRoom,
      suggested_block: suggestedBlock,
      summary,
      status,
      processed_at: status === "auto_ingested" ? new Date().toISOString() : null,
    });

    if (insertError) {
      console.error("Zoom webhook: Failed to insert queue item:", insertError);
    }

    return NextResponse.json({ ok: true });
  }

  // Handle other events (meeting.started, meeting.ended, etc.)
  // These can be extended as needed
  return NextResponse.json({ ok: true });
}
