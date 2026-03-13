// ════════════════════════════════════════════════════════════════════════════
// Zoom Sync Client
// Fetches meeting recordings and transcripts via Zoom API
// ════════════════════════════════════════════════════════════════════════════

import type { MeetingRecording } from "@/types/integration";

const ZOOM_API_BASE = "https://api.zoom.us/v2";

type ZoomRecordingsResponse = {
  meetings: ZoomMeeting[];
  next_page_token?: string;
};

type ZoomMeeting = {
  id: string;
  uuid: string;
  topic: string;
  start_time: string;
  duration: number;
  host_email: string;
  recording_files: ZoomRecordingFile[];
};

type ZoomRecordingFile = {
  id: string;
  file_type: string;
  file_extension: string;
  download_url: string;
  recording_type: string;
  status: string;
};

export type ZoomSyncOptions = {
  accessToken: string;
  lastSyncAt?: string | null;
  maxResults?: number;
};

export type ZoomSyncResult = {
  success: boolean;
  recordings: MeetingRecording[];
  errors: string[];
};

/**
 * Fetch meeting recordings with transcripts
 */
export async function fetchZoomRecordings(
  options: ZoomSyncOptions
): Promise<ZoomSyncResult> {
  const { accessToken, lastSyncAt, maxResults = 30 } = options;

  const errors: string[] = [];
  const recordings: MeetingRecording[] = [];

  try {
    // Calculate date range
    const from = lastSyncAt
      ? new Date(lastSyncAt).toISOString().split("T")[0]
      : getDateDaysAgo(30);
    const to = new Date().toISOString().split("T")[0];

    // Fetch recordings
    const url = new URL(`${ZOOM_API_BASE}/users/me/recordings`);
    url.searchParams.set("from", from);
    url.searchParams.set("to", to);
    url.searchParams.set("page_size", String(maxResults));

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        recordings: [],
        errors: [`Failed to fetch recordings: ${response.status} - ${errorText}`],
      };
    }

    const data: ZoomRecordingsResponse = await response.json();

    // Process each meeting
    for (const meeting of data.meetings) {
      try {
        // Find transcript file
        const transcriptFile = meeting.recording_files.find(
          (f) => f.file_type === "TRANSCRIPT" && f.status === "completed"
        );

        // Find audio transcript (VTT)
        const vttFile = meeting.recording_files.find(
          (f) => f.recording_type === "audio_transcript" && f.status === "completed"
        );

        let transcript: string | undefined;

        // Try to download transcript
        if (transcriptFile || vttFile) {
          const transcriptUrl = (transcriptFile || vttFile)!.download_url;
          transcript = await downloadTranscript(accessToken, transcriptUrl);
        }

        recordings.push({
          id: meeting.uuid,
          meetingId: meeting.id,
          topic: meeting.topic,
          startTime: meeting.start_time,
          duration: meeting.duration,
          hostEmail: meeting.host_email,
          transcript,
        });
      } catch (error) {
        errors.push(`Failed to process meeting ${meeting.id}: ${error}`);
      }
    }

    return {
      success: true,
      recordings,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      recordings: [],
      errors: [`Zoom sync failed: ${error}`],
    };
  }
}

/**
 * Download transcript content
 */
async function downloadTranscript(
  accessToken: string,
  url: string
): Promise<string | undefined> {
  try {
    // Zoom download URLs require the access token as a query param
    const downloadUrl = new URL(url);
    downloadUrl.searchParams.set("access_token", accessToken);

    const response = await fetch(downloadUrl.toString());

    if (!response.ok) {
      console.error("Failed to download transcript:", response.status);
      return undefined;
    }

    const content = await response.text();

    // Parse VTT if that's the format
    if (url.includes(".vtt") || content.startsWith("WEBVTT")) {
      return parseVttToText(content);
    }

    return content;
  } catch (error) {
    console.error("Transcript download error:", error);
    return undefined;
  }
}

/**
 * Parse VTT subtitle format to plain text
 */
function parseVttToText(vtt: string): string {
  const lines = vtt.split("\n");
  const textLines: string[] = [];
  let currentSpeaker = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip headers and timestamps
    if (
      trimmed === "WEBVTT" ||
      trimmed === "" ||
      trimmed.match(/^\d{2}:\d{2}/) || // Timestamps
      trimmed.match(/^NOTE/)
    ) {
      continue;
    }

    // Check for speaker indicator (common Zoom format: "Speaker Name: text")
    const speakerMatch = trimmed.match(/^([^:]+):\s*(.*)$/);
    if (speakerMatch) {
      const [, speaker, text] = speakerMatch;
      if (speaker !== currentSpeaker) {
        currentSpeaker = speaker;
        textLines.push(`\n${speaker}:`);
      }
      if (text) {
        textLines.push(text);
      }
    } else {
      textLines.push(trimmed);
    }
  }

  return textLines.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Get date string for N days ago
 */
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

/**
 * Fetch a single meeting's details
 */
export async function fetchMeetingDetails(
  accessToken: string,
  meetingId: string
): Promise<{
  topic: string;
  startTime: string;
  duration: number;
  participants?: { name: string; email?: string }[];
} | null> {
  try {
    const response = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      topic: data.topic,
      startTime: data.start_time,
      duration: data.duration,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch meeting participants (requires additional scopes)
 */
export async function fetchMeetingParticipants(
  accessToken: string,
  meetingUuid: string
): Promise<string[]> {
  try {
    // Double-encode UUID as required by Zoom API
    const encodedUuid = encodeURIComponent(encodeURIComponent(meetingUuid));
    const response = await fetch(
      `${ZOOM_API_BASE}/past_meetings/${encodedUuid}/participants`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.participants || []).map(
      (p: { name: string }) => p.name
    );
  } catch {
    return [];
  }
}
