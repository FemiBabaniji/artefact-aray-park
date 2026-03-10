// Default configuration for standalone artefacts

import type { StandaloneRoom, Identity, GuestArtefactState } from "@/types/artefact";

// ── Default Rooms ────────────────────────────────────────────────────────────

export const DEFAULT_ROOMS: StandaloneRoom[] = [
  {
    id: "room_about",
    key: "about",
    label: "About",
    prompt: "Bio, background, what you do",
    visibility: "public",
    orderIndex: 0,
    blocks: [],
  },
  {
    id: "room_projects",
    key: "projects",
    label: "Projects",
    prompt: "Work samples, case studies",
    visibility: "public",
    orderIndex: 1,
    blocks: [],
  },
  {
    id: "room_skills",
    key: "skills",
    label: "Skills",
    prompt: "Capabilities, tools, methods",
    visibility: "public",
    orderIndex: 2,
    blocks: [],
  },
  {
    id: "room_experience",
    key: "experience",
    label: "Experience",
    prompt: "Work history, roles",
    visibility: "public",
    orderIndex: 3,
    blocks: [],
  },
  {
    id: "room_timeline",
    key: "timeline",
    label: "Timeline",
    prompt: "Chronological milestones",
    visibility: "public",
    orderIndex: 4,
    blocks: [],
  },
  {
    id: "room_metrics",
    key: "metrics",
    label: "Metrics",
    prompt: "Quantifiable achievements",
    visibility: "public",
    orderIndex: 5,
    blocks: [],
  },
];

// ── Default Identity ─────────────────────────────────────────────────────────

export const DEFAULT_IDENTITY: Identity = {
  name: "",
  title: "",
  bio: "",
  location: "",
  skills: [],
  links: [],
};

// ── Create Initial Guest State ──────────────────────────────────────────────

export function createInitialGuestState(): GuestArtefactState {
  return {
    sessionId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    identity: { ...DEFAULT_IDENTITY },
    rooms: DEFAULT_ROOMS.map((room, idx) => ({
      ...room,
      id: `room_${room.key}_${crypto.randomUUID().slice(0, 8)}`,
      orderIndex: idx,
    })),
  };
}

// ── localStorage Key ─────────────────────────────────────────────────────────

export const GUEST_STORAGE_KEY = "artefact_guest";
export const GUEST_TOUR_KEY = "artefact_tour_seen";
export const GUEST_ROOM_TOOLTIPS_KEY = "artefact_room_tooltips";
