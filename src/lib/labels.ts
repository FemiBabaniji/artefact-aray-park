import type { SectionKey, SectionStatus } from "@/types/section";

// ─────────────────────────────────────────────────────────────────────────────
// Section Labels
// ─────────────────────────────────────────────────────────────────────────────

type SectionLabel = {
  admin:    string;  // Internal/admin name (used in database)
  name:     string;  // Human-friendly name (what members see)
  subtitle: string;  // What to write (shown when empty/in progress)
};

export const SECTION_LABELS: Record<SectionKey, SectionLabel> = {
  practice: {
    admin:    "Practice Statement",
    name:     "Your practice",
    subtitle: "What you make and why you make it",
  },
  focus: {
    admin:    "Current Focus",
    name:     "What you're working on",
    subtitle: "The specific project or question you're exploring right now",
  },
  material: {
    admin:    "Material Sourcing Plan",
    name:     "Your materials",
    subtitle: "What you work with and where you get it",
  },
  influences: {
    admin:    "Influences & Context",
    name:     "Who shaped you",
    subtitle: "Artists, thinkers, or movements that inform your work",
  },
  series: {
    admin:    "Project Series",
    name:     "Your body of work",
    subtitle: "The projects that belong together under this program",
  },
  exhibition: {
    admin:    "Exhibition Goals",
    name:     "Where you want to show",
    subtitle: "The venues, contexts, or audiences you're working toward",
  },
  collab: {
    admin:    "Collaboration Outreach",
    name:     "Who you want to work with",
    subtitle: "Collaborators, institutions, or communities you're reaching out to",
  },
};

export function getSectionName(key: SectionKey): string {
  return SECTION_LABELS[key]?.name || key;
}

export function getSectionSubtitle(key: SectionKey): string {
  return SECTION_LABELS[key]?.subtitle || "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkpoint Labels (replace CP1/CP2)
// ─────────────────────────────────────────────────────────────────────────────

type CheckpointLabel = {
  code:  string;  // Short code (cp1, cp2)
  name:  string;  // Human-friendly name
  short: string;  // Abbreviated for tight spaces
};

export const CHECKPOINT_LABELS: Record<1 | 2, CheckpointLabel> = {
  1: { code: "cp1", name: "Foundation",  short: "Found." },
  2: { code: "cp2", name: "Development", short: "Dev." },
};

export function getCheckpointName(cp: 1 | 2): string {
  return CHECKPOINT_LABELS[cp]?.name || `CP${cp}`;
}

export function formatCheckpointProgress(cp: 1 | 2, done: number, total: number): string {
  const name = CHECKPOINT_LABELS[cp]?.name || `Checkpoint ${cp}`;
  if (done === 0) return `${name}: not started`;
  if (done === total) return `${name}: complete`;
  return `${name}: ${done} of ${total} complete`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Member-Facing Status Messages
// ─────────────────────────────────────────────────────────────────────────────

type StatusMessage = {
  label:   string;  // Short label
  message: string;  // Conversational message
};

export const STATUS_MESSAGES: Record<SectionStatus, StatusMessage> = {
  empty: {
    label:   "Not started",
    message: "Start writing whenever you're ready",
  },
  in_progress: {
    label:   "In progress",
    message: "Your mentor asked for changes",
  },
  submitted: {
    label:   "Sent",
    message: "Waiting for feedback",
  },
  reviewed: {
    label:   "Feedback ready",
    message: "Feedback left — read it below",
  },
  accepted: {
    label:   "Complete",
    message: "Complete",
  },
};

export function getStatusMessage(status: SectionStatus, hasFeedback?: boolean): string {
  // Special case: in_progress with no prior feedback means it's fresh work
  if (status === "in_progress" && !hasFeedback) {
    return "Keep working on this";
  }
  return STATUS_MESSAGES[status]?.message || status;
}

export function getStatusLabel(status: SectionStatus): string {
  return STATUS_MESSAGES[status]?.label || status;
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Summary (for compact card)
// ─────────────────────────────────────────────────────────────────────────────

export function formatOverallProgress(completed: number, total: number): string {
  if (completed === 0) return "Not started";
  if (completed === total) return "All sections complete";
  return `${completed} of ${total} sections complete`;
}

export function formatStageProgress(stageName: string, completed: number, total: number): string {
  return `${stageName} stage · ${completed} of ${total} complete`;
}
