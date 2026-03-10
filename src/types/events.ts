// ════════════════════════════════════════════════════════════════════════════
// Event-Sourced Artefact System (P0)
// Append-only event log with state reducer
// ════════════════════════════════════════════════════════════════════════════

import type { Identity, StandaloneRoom, StandaloneBlock, RoomVisibility } from "./artefact";

// ── Lifecycle States ────────────────────────────────────────────────────────

export type LifecycleState =
  | "draft"      // Initial state, guest editing
  | "claimed"    // User authenticated, owner_id assigned
  | "published"  // Public slug active
  | "archived";  // Soft-deleted, not visible

// ── Event Types ─────────────────────────────────────────────────────────────

export type ArtefactEventType =
  // Artefact lifecycle
  | "artefact_created"
  | "artefact_claimed"
  | "artefact_published"
  | "artefact_archived"
  // Identity
  | "identity_updated"
  // Rooms
  | "room_added"
  | "room_updated"
  | "room_removed"
  | "rooms_reordered"
  // Blocks
  | "block_added"
  | "block_updated"
  | "block_removed"
  | "blocks_reordered";

// ── Event Payloads ──────────────────────────────────────────────────────────

export type ArtefactCreatedPayload = {
  sessionId: string;
  identity: Identity;
  rooms: StandaloneRoom[];
};

export type ArtefactClaimedPayload = {
  ownerId: string;
  email?: string;
};

export type ArtefactPublishedPayload = {
  slug: string;
};

export type ArtefactArchivedPayload = {
  reason?: string;
};

export type IdentityUpdatedPayload = Partial<Identity>;

export type RoomAddedPayload = {
  room: StandaloneRoom;
};

export type RoomUpdatedPayload = {
  roomId: string;
  updates: Partial<Omit<StandaloneRoom, "id" | "blocks">>;
};

export type RoomRemovedPayload = {
  roomId: string;
};

export type RoomsReorderedPayload = {
  roomIds: string[];
};

export type BlockAddedPayload = {
  roomId: string;
  block: StandaloneBlock;
};

export type BlockUpdatedPayload = {
  roomId: string;
  blockId: string;
  updates: Partial<Omit<StandaloneBlock, "id">>;
};

export type BlockRemovedPayload = {
  roomId: string;
  blockId: string;
};

export type BlocksReorderedPayload = {
  roomId: string;
  blockIds: string[];
};

// ── Event Union ─────────────────────────────────────────────────────────────

export type ArtefactEventPayload =
  | { type: "artefact_created"; payload: ArtefactCreatedPayload }
  | { type: "artefact_claimed"; payload: ArtefactClaimedPayload }
  | { type: "artefact_published"; payload: ArtefactPublishedPayload }
  | { type: "artefact_archived"; payload: ArtefactArchivedPayload }
  | { type: "identity_updated"; payload: IdentityUpdatedPayload }
  | { type: "room_added"; payload: RoomAddedPayload }
  | { type: "room_updated"; payload: RoomUpdatedPayload }
  | { type: "room_removed"; payload: RoomRemovedPayload }
  | { type: "rooms_reordered"; payload: RoomsReorderedPayload }
  | { type: "block_added"; payload: BlockAddedPayload }
  | { type: "block_updated"; payload: BlockUpdatedPayload }
  | { type: "block_removed"; payload: BlockRemovedPayload }
  | { type: "blocks_reordered"; payload: BlocksReorderedPayload };

// ── Event Structure ─────────────────────────────────────────────────────────

export type ArtefactEvent = ArtefactEventPayload & {
  id: string;
  artefactId: string;
  timestamp: string;
  sequence: number;  // Monotonic sequence for ordering
  actorId?: string;  // User ID if authenticated, undefined for guest
};

// ── Artefact State (computed from events) ───────────────────────────────────

export type ArtefactState = {
  id: string;
  sessionId: string;
  ownerId: string | null;       // null = guest, immutable once set
  slug: string | null;
  lifecycleState: LifecycleState;
  identity: Identity;
  rooms: StandaloneRoom[];
  createdAt: string;
  updatedAt: string;
  version: number;              // Event sequence number
};

// ── Event Store ─────────────────────────────────────────────────────────────

export type EventStore = {
  artefactId: string;
  events: ArtefactEvent[];
  lastSequence: number;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export function createEventId(): string {
  return `evt_${crypto.randomUUID().slice(0, 12)}`;
}

export function createArtefactId(): string {
  return `art_${crypto.randomUUID().slice(0, 12)}`;
}

export function createEvent<T extends ArtefactEventPayload>(
  artefactId: string,
  sequence: number,
  eventData: T,
  actorId?: string
): ArtefactEvent {
  return {
    id: createEventId(),
    artefactId,
    timestamp: new Date().toISOString(),
    sequence,
    actorId,
    ...eventData,
  };
}
