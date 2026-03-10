import type { Section } from "./section";

// Legacy artefact (for cohort/community system)
export type Artefact = {
  memberId:  string;
  sections:  Section[];
  wsContent: string;
  updatedAt: string;
};

// ════════════════════════════════════════════════════════════════════════════
// Standalone Artefact System
// A context compiler that generates multiple outputs from one structured object
// ════════════════════════════════════════════════════════════════════════════

import type { Block } from "./room";

// ── Identity ─────────────────────────────────────────────────────────────────

export type Identity = {
  name: string;
  title: string;
  bio: string;
  location: string;
  skills: string[];
  links: IdentityLink[];
  email?: string;
  avatar?: string;
};

export type IdentityLink = {
  label: string;
  url: string;
};

export const DEFAULT_IDENTITY: Identity = {
  name: "",
  title: "",
  bio: "",
  location: "",
  skills: [],
  links: [],
};

// ── Rooms (Standalone) ───────────────────────────────────────────────────────

export type RoomVisibility = "public" | "private" | "unlisted";

// Reuse Block type from room.ts for compatibility with BlockComposer
export type StandaloneBlock = Block;

export type StandaloneRoom = {
  id: string;
  key: string;
  label: string;
  prompt?: string;
  visibility: RoomVisibility;
  orderIndex: number;
  blocks: StandaloneBlock[];
};

// ── Guest State ──────────────────────────────────────────────────────────────

export type GuestArtefactState = {
  sessionId: string;
  createdAt: string;
  identity: Identity;
  rooms: StandaloneRoom[];
};

// ── Standalone Artefact (Full Model) ─────────────────────────────────────────

export type StandaloneArtefact = {
  id: string;
  userId?: string;
  slug?: string;
  identity: Identity;
  rooms: StandaloneRoom[];
  createdAt: string;
  updatedAt: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

export function createStandaloneRoom(key: string, label: string, prompt?: string): StandaloneRoom {
  return {
    id: crypto.randomUUID(),
    key,
    label,
    prompt,
    visibility: "public",
    orderIndex: 0,
    blocks: [],
  };
}
