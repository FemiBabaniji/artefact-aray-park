// ════════════════════════════════════════════════════════════════════════════
// Engagement Event Store
// Manages append-only event log for engagements
// ════════════════════════════════════════════════════════════════════════════

import type {
  EngagementEvent,
  EngagementEventPayload,
} from "@/types/engagement-events";
import { createEngagementEventId } from "@/types/engagement-events";
import {
  createEngagementId,
  createEngagementRoomId,
  DEFAULT_ENGAGEMENT_ROOMS,
} from "@/types/engagement";
import type { EngagementRoomSchema } from "@/types/engagement";
import { reduceEngagementEvents, createEmptyEngagementState, type EngagementState } from "./reducer";

// ── Event Store Type ────────────────────────────────────────────────────────

export type EngagementEventStore = {
  engagementId: string;
  events: EngagementEvent[];
  lastSequence: number;
};

// ── Event Store Factory ─────────────────────────────────────────────────────

export function createEngagementEventStore(engagementId?: string): EngagementEventStore {
  return {
    engagementId: engagementId ?? createEngagementId(),
    events: [],
    lastSequence: 0,
  };
}

// ── Event Appending ─────────────────────────────────────────────────────────

export function appendEngagementEvent(
  store: EngagementEventStore,
  eventData: EngagementEventPayload,
  actorId: string
): { store: EngagementEventStore; event: EngagementEvent } {
  const nextSequence = store.lastSequence + 1;

  const event: EngagementEvent = {
    id: createEngagementEventId(),
    engagementId: store.engagementId,
    timestamp: new Date().toISOString(),
    sequence: nextSequence,
    actorId,
    ...eventData,
  };

  const newStore: EngagementEventStore = {
    ...store,
    events: [...store.events, event],
    lastSequence: nextSequence,
  };

  return { store: newStore, event };
}

// ── Compute State ───────────────────────────────────────────────────────────

export function computeEngagementState(store: EngagementEventStore): EngagementState {
  if (store.events.length === 0) {
    return createEmptyEngagementState(store.engagementId);
  }
  return reduceEngagementEvents(store.events);
}

// ── Initialize Engagement ───────────────────────────────────────────────────

export function initializeEngagement(
  name: string,
  ownerId: string,
  clientId?: string,
  rooms?: EngagementRoomSchema[]
): EngagementEventStore {
  const engagementId = createEngagementId();

  const roomSchemas: EngagementRoomSchema[] = (rooms ?? DEFAULT_ENGAGEMENT_ROOMS).map(
    (room, idx) => ({
      ...room,
      id: createEngagementRoomId(),
      orderIndex: idx,
    })
  );

  const store = createEngagementEventStore(engagementId);
  const { store: newStore } = appendEngagementEvent(
    store,
    {
      type: "engagement_created",
      payload: {
        name,
        clientId,
        rooms: roomSchemas,
        ownerId,
      },
    },
    ownerId
  );

  return newStore;
}

// ── Event Builders (Convenience) ────────────────────────────────────────────

export const EngagementEventBuilders = {
  updated: (updates: {
    name?: string;
    startDate?: string;
    endDate?: string;
    value?: number;
    currency?: string;
    theme?: string;
  }): EngagementEventPayload => ({
    type: "engagement_updated",
    payload: updates,
  }),

  phaseChanged: (
    fromPhase: string | null,
    toPhase: string,
    reason?: string
  ): EngagementEventPayload => ({
    type: "engagement_phase_changed",
    payload: { fromPhase: fromPhase as never, toPhase: toPhase as never, reason },
  }),

  archived: (reason?: string): EngagementEventPayload => ({
    type: "engagement_archived",
    payload: { reason },
  }),

  clientAttached: (clientId: string, clientName: string): EngagementEventPayload => ({
    type: "client_attached",
    payload: { clientId, clientName },
  }),

  clientDetached: (clientId: string): EngagementEventPayload => ({
    type: "client_detached",
    payload: { clientId },
  }),

  participantInvited: (
    participantId: string,
    name: string,
    email: string,
    role: string,
    invitedBy: string
  ): EngagementEventPayload => ({
    type: "participant_invited",
    payload: { participantId, name, email, role: role as never, invitedBy },
  }),

  participantJoined: (participantId: string, userId?: string): EngagementEventPayload => ({
    type: "participant_joined",
    payload: { participantId, userId },
  }),

  participantRemoved: (
    participantId: string,
    removedBy: string,
    reason?: string
  ): EngagementEventPayload => ({
    type: "participant_removed",
    payload: { participantId, removedBy, reason },
  }),

  roomAdded: (room: EngagementRoomSchema): EngagementEventPayload => ({
    type: "room_added",
    payload: { room },
  }),

  roomUpdated: (
    roomId: string,
    updates: Partial<EngagementRoomSchema>
  ): EngagementEventPayload => ({
    type: "room_updated",
    payload: { roomId, updates },
  }),

  roomRemoved: (roomId: string): EngagementEventPayload => ({
    type: "room_removed",
    payload: { roomId },
  }),

  roomVisibilityChanged: (
    roomId: string,
    fromVisibility: string,
    toVisibility: string
  ): EngagementEventPayload => ({
    type: "room_visibility_changed",
    payload: { roomId, fromVisibility, toVisibility },
  }),

  roomsReordered: (roomIds: string[]): EngagementEventPayload => ({
    type: "rooms_reordered",
    payload: { roomIds },
  }),

  blockAdded: (roomId: string, block: unknown): EngagementEventPayload => ({
    type: "block_added",
    payload: { roomId, block: block as never },
  }),

  blockUpdated: (
    roomId: string,
    blockId: string,
    updates: Record<string, unknown>
  ): EngagementEventPayload => ({
    type: "block_updated",
    payload: { roomId, blockId, updates },
  }),

  blockRemoved: (roomId: string, blockId: string): EngagementEventPayload => ({
    type: "block_removed",
    payload: { roomId, blockId },
  }),

  blocksReordered: (roomId: string, blockIds: string[]): EngagementEventPayload => ({
    type: "blocks_reordered",
    payload: { roomId, blockIds },
  }),
};
