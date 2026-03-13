// ════════════════════════════════════════════════════════════════════════════
// Engagement Event Sourcing
// Extends the existing event pattern for engagement-specific events
// ════════════════════════════════════════════════════════════════════════════

import type { EngagementPhase, EngagementRoom, EngagementBlock, EngagementRoomSchema } from "./engagement";
import type { ParticipantRole, ParticipantAccess } from "./participant";

// ── Event Types ───────────────────────────────────────────────────────────────

export type EngagementEventType =
  // Engagement lifecycle
  | "engagement_created"
  | "engagement_updated"
  | "engagement_phase_changed"
  | "engagement_archived"
  // Client
  | "client_attached"
  | "client_detached"
  // Participants
  | "participant_invited"
  | "participant_joined"
  | "participant_removed"
  | "participant_role_changed"
  | "participant_access_updated"
  // Rooms
  | "room_added"
  | "room_updated"
  | "room_removed"
  | "room_visibility_changed"
  | "rooms_reordered"
  // Blocks
  | "block_added"
  | "block_updated"
  | "block_removed"
  | "blocks_reordered";

// ── Event Payloads ────────────────────────────────────────────────────────────

export type EngagementCreatedPayload = {
  name: string;
  clientId?: string;
  rooms: EngagementRoomSchema[];
  ownerId: string;
};

export type EngagementUpdatedPayload = {
  name?: string;
  startDate?: string;
  endDate?: string;
  value?: number;
  currency?: string;
  theme?: string;
};

export type EngagementPhaseChangedPayload = {
  fromPhase: EngagementPhase | null;
  toPhase: EngagementPhase;
  reason?: string;
};

export type EngagementArchivedPayload = {
  reason?: string;
};

export type ClientAttachedPayload = {
  clientId: string;
  clientName: string;
};

export type ClientDetachedPayload = {
  clientId: string;
};

export type ParticipantInvitedPayload = {
  participantId: string;
  name: string;
  email: string;
  role: ParticipantRole;
  invitedBy: string;
};

export type ParticipantJoinedPayload = {
  participantId: string;
  userId?: string;
};

export type ParticipantRemovedPayload = {
  participantId: string;
  removedBy: string;
  reason?: string;
};

export type ParticipantRoleChangedPayload = {
  participantId: string;
  fromRole: ParticipantRole;
  toRole: ParticipantRole;
};

export type ParticipantAccessUpdatedPayload = {
  participantId: string;
  access: ParticipantAccess;
};

export type RoomAddedPayload = {
  room: EngagementRoomSchema;
};

export type RoomUpdatedPayload = {
  roomId: string;
  updates: Partial<Omit<EngagementRoomSchema, "id">>;
};

export type RoomRemovedPayload = {
  roomId: string;
};

export type RoomVisibilityChangedPayload = {
  roomId: string;
  fromVisibility: string;
  toVisibility: string;
};

export type RoomsReorderedPayload = {
  roomIds: string[];
};

export type BlockAddedPayload = {
  roomId: string;
  block: EngagementBlock;
};

export type BlockUpdatedPayload = {
  roomId: string;
  blockId: string;
  updates: Partial<Omit<EngagementBlock, "id" | "roomId">>;
};

export type BlockRemovedPayload = {
  roomId: string;
  blockId: string;
};

export type BlocksReorderedPayload = {
  roomId: string;
  blockIds: string[];
};

// ── Event Union ───────────────────────────────────────────────────────────────

export type EngagementEventPayload =
  | { type: "engagement_created"; payload: EngagementCreatedPayload }
  | { type: "engagement_updated"; payload: EngagementUpdatedPayload }
  | { type: "engagement_phase_changed"; payload: EngagementPhaseChangedPayload }
  | { type: "engagement_archived"; payload: EngagementArchivedPayload }
  | { type: "client_attached"; payload: ClientAttachedPayload }
  | { type: "client_detached"; payload: ClientDetachedPayload }
  | { type: "participant_invited"; payload: ParticipantInvitedPayload }
  | { type: "participant_joined"; payload: ParticipantJoinedPayload }
  | { type: "participant_removed"; payload: ParticipantRemovedPayload }
  | { type: "participant_role_changed"; payload: ParticipantRoleChangedPayload }
  | { type: "participant_access_updated"; payload: ParticipantAccessUpdatedPayload }
  | { type: "room_added"; payload: RoomAddedPayload }
  | { type: "room_updated"; payload: RoomUpdatedPayload }
  | { type: "room_removed"; payload: RoomRemovedPayload }
  | { type: "room_visibility_changed"; payload: RoomVisibilityChangedPayload }
  | { type: "rooms_reordered"; payload: RoomsReorderedPayload }
  | { type: "block_added"; payload: BlockAddedPayload }
  | { type: "block_updated"; payload: BlockUpdatedPayload }
  | { type: "block_removed"; payload: BlockRemovedPayload }
  | { type: "blocks_reordered"; payload: BlocksReorderedPayload };

// ── Actor Types ──────────────────────────────────────────────────────────────

export type EventActorType = "user" | "ai" | "system";

export type EventActor = {
  type: EventActorType;
  id?: string;       // User ID if type is "user"
  model?: string;    // AI model identifier if type is "ai" (e.g., "claude-opus-4-5")
};

// ── Event Structure ───────────────────────────────────────────────────────────

export type EngagementEvent = EngagementEventPayload & {
  id: string;
  engagementId: string;
  timestamp: string;
  sequence: number;      // Monotonic sequence for ordering
  actorId: string | null; // User ID who triggered the event (null for AI/system)
  actorType?: EventActorType;  // Type of actor
  actorModel?: string;   // AI model if actorType is "ai"
};

// ── Event Store ───────────────────────────────────────────────────────────────

export type EngagementEventStore = {
  engagementId: string;
  events: EngagementEvent[];
  lastSequence: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function createEngagementEventId(): string {
  return crypto.randomUUID();
}

export function createEngagementEvent<T extends EngagementEventPayload>(
  engagementId: string,
  sequence: number,
  eventData: T,
  actor: EventActor | string // Accept string for backwards compatibility
): EngagementEvent {
  const actorInfo = typeof actor === "string"
    ? { type: "user" as EventActorType, id: actor }
    : actor;

  return {
    id: createEngagementEventId(),
    engagementId,
    timestamp: new Date().toISOString(),
    sequence,
    actorId: actorInfo.id ?? null,
    actorType: actorInfo.type,
    actorModel: actorInfo.model,
    ...eventData,
  };
}
