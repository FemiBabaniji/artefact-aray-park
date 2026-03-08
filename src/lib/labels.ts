import type { RoomType, StageMarker, RoomStatus } from "@/types/room";

// -------------------------------------------------------------------------
// Room Type Labels
// -------------------------------------------------------------------------

type RoomTypeLabel = {
  name: string;
  icon: string;
  description: string;
};

export const ROOM_TYPE_LABELS: Record<RoomType, RoomTypeLabel> = {
  text: {
    name: "Text",
    icon: "T",
    description: "Long-form writing space with rich editor",
  },
  gallery: {
    name: "Gallery",
    icon: "\u229E",
    description: "Grid of uploaded images",
  },
  moodboard: {
    name: "Moodboard",
    icon: "\u25A6",
    description: "Freeform canvas of images, links, and text",
  },
  works: {
    name: "Works",
    icon: "\u2261",
    description: "Structured list of projects",
  },
  links: {
    name: "Links",
    icon: "\u2197",
    description: "Curated collection of URLs",
  },
  embed: {
    name: "Embed",
    icon: "\u25B6",
    description: "Single embedded media (video, audio)",
  },
  process: {
    name: "Process",
    icon: "\u21BB",
    description: "Chronological journal of making",
  },
};

export function getRoomTypeName(type: RoomType): string {
  return ROOM_TYPE_LABELS[type]?.name ?? type;
}

export function getRoomTypeIcon(type: RoomType): string {
  return ROOM_TYPE_LABELS[type]?.icon ?? "\u25A1";
}

// -------------------------------------------------------------------------
// Stage Marker Labels (replaces CP1/CP2)
// -------------------------------------------------------------------------

type StageMarkerLabel = {
  code: string;
  name: string;
  short: string;
};

export const STAGE_MARKER_LABELS: Record<StageMarker, StageMarkerLabel> = {
  early: { code: "early", name: "Early", short: "Early" },
  later: { code: "later", name: "Later", short: "Later" },
  ongoing: { code: "ongoing", name: "Ongoing", short: "Ongoing" },
};

export function getStageMarkerName(marker: StageMarker): string {
  return STAGE_MARKER_LABELS[marker]?.name ?? marker;
}

// -------------------------------------------------------------------------
// Room Labels (default labels by key)
// -------------------------------------------------------------------------

type SectionLabel = {
  admin: string;
  name: string;
  subtitle: string;
};

export const DEFAULT_ROOM_LABELS: Record<string, SectionLabel> = {
  practice: {
    admin: "Practice Statement",
    name: "Your practice",
    subtitle: "What you make and why you make it",
  },
  focus: {
    admin: "Current Focus",
    name: "What you're working on",
    subtitle: "The specific project or question you're exploring right now",
  },
  material: {
    admin: "Material Sourcing Plan",
    name: "Your materials",
    subtitle: "What you work with and where you get it",
  },
  influences: {
    admin: "Influences & Context",
    name: "Who shaped you",
    subtitle: "Artists, thinkers, or movements that inform your work",
  },
  series: {
    admin: "Project Series",
    name: "Your body of work",
    subtitle: "The projects that belong together under this program",
  },
  exhibition: {
    admin: "Exhibition Goals",
    name: "Where you want to show",
    subtitle: "The venues, contexts, or audiences you're working toward",
  },
  collab: {
    admin: "Collaboration Outreach",
    name: "Who you want to work with",
    subtitle: "Collaborators, institutions, or communities you're reaching out to",
  },
  reference_board: {
    admin: "Reference Board",
    name: "Reference board",
    subtitle: "Images, links, and references that inform your work",
  },
  works_list: {
    admin: "Works List",
    name: "Your work",
    subtitle: "Documentation of finished pieces",
  },
  showreel: {
    admin: "Showreel",
    name: "Showreel",
    subtitle: "Link your primary video, audio, or interactive work",
  },
  process_journal: {
    admin: "Process Journal",
    name: "Process journal",
    subtitle: "Document your making over time",
  },
};

// Backwards compatible alias
export const SECTION_LABELS = DEFAULT_ROOM_LABELS;

export function getRoomName(key: string, label?: string): string {
  if (label) return label;
  return DEFAULT_ROOM_LABELS[key]?.name ?? key;
}

export function getRoomSubtitle(key: string, prompt?: string): string {
  if (prompt) return prompt;
  return DEFAULT_ROOM_LABELS[key]?.subtitle ?? "";
}

// Legacy functions (backwards compatibility)
export function getSectionName(key: string): string {
  return DEFAULT_ROOM_LABELS[key]?.name ?? key;
}

export function getSectionSubtitle(key: string): string {
  return DEFAULT_ROOM_LABELS[key]?.subtitle ?? "";
}

// -------------------------------------------------------------------------
// Checkpoint Labels (legacy - maps to stage markers)
// -------------------------------------------------------------------------

type CheckpointLabel = {
  code: string;
  name: string;
  short: string;
};

export const CHECKPOINT_LABELS: Record<1 | 2, CheckpointLabel> = {
  1: { code: "early", name: "Early", short: "Early" },
  2: { code: "later", name: "Later", short: "Later" },
};

export function getCheckpointName(cp: 1 | 2): string {
  return CHECKPOINT_LABELS[cp]?.name ?? `CP${cp}`;
}

export function formatCheckpointProgress(cp: 1 | 2, done: number, total: number): string {
  const name = CHECKPOINT_LABELS[cp]?.name ?? `Checkpoint ${cp}`;
  if (done === 0) return `${name}: not started`;
  if (done === total) return `${name}: complete`;
  return `${name}: ${done} of ${total} complete`;
}

export function formatStageMarkerProgress(marker: StageMarker, done: number, total: number): string {
  const name = getStageMarkerName(marker);
  if (done === 0) return `${name}: not started`;
  if (done === total) return `${name}: complete`;
  return `${name}: ${done} of ${total} complete`;
}

// -------------------------------------------------------------------------
// Member-Facing Status Messages
// -------------------------------------------------------------------------

type StatusMessage = {
  label: string;
  message: string;
};

export const STATUS_MESSAGES: Record<RoomStatus, StatusMessage> = {
  empty: {
    label: "Not started",
    message: "Start writing whenever you're ready",
  },
  in_progress: {
    label: "In progress",
    message: "Your mentor asked for changes",
  },
  submitted: {
    label: "Sent",
    message: "Waiting for feedback",
  },
  reviewed: {
    label: "Feedback ready",
    message: "Feedback left \u2014 read it below",
  },
  accepted: {
    label: "Complete",
    message: "Complete",
  },
  ongoing: {
    label: "Ongoing",
    message: "Keep building \u2014 no submission required",
  },
};

export function getStatusMessage(status: RoomStatus, hasFeedback?: boolean): string {
  if (status === "in_progress" && !hasFeedback) {
    return "Keep working on this";
  }
  return STATUS_MESSAGES[status]?.message ?? status;
}

export function getStatusLabel(status: RoomStatus): string {
  return STATUS_MESSAGES[status]?.label ?? status;
}

// -------------------------------------------------------------------------
// Progress Summary
// -------------------------------------------------------------------------

export function formatOverallProgress(completed: number, total: number): string {
  if (completed === 0) return "Not started";
  if (completed === total) return "All rooms complete";
  return `${completed} of ${total} rooms complete`;
}

export function formatStageProgress(stageName: string, completed: number, total: number): string {
  return `${stageName} stage \u00B7 ${completed} of ${total} complete`;
}
