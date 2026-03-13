// ════════════════════════════════════════════════════════════════════════════
// Engagement State Reducer
// Computes current state by reducing event log: state = reduce(events)
// ════════════════════════════════════════════════════════════════════════════

import type {
  EngagementEvent,
  EngagementEventPayload,
} from "@/types/engagement-events";
import type {
  Engagement,
  EngagementPhase,
  EngagementRoom,
  EngagementBlock,
  EngagementRoomSchema,
  DEFAULT_ENGAGEMENT_ROOMS,
} from "@/types/engagement";
import type { Participant } from "@/types/participant";

// ── Engagement State ────────────────────────────────────────────────────────

export type EngagementState = {
  id: string;
  slug: string;
  name: string;
  clientId: string | null;
  phase: EngagementPhase;
  startDate: string | null;
  endDate: string | null;
  value: number | null;
  currency: string;
  theme: string;
  rooms: EngagementRoom[];
  participants: Participant[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

// ── Initial State ───────────────────────────────────────────────────────────

export function createEmptyEngagementState(engagementId: string): EngagementState {
  return {
    id: engagementId,
    slug: "",
    name: "",
    clientId: null,
    phase: "intake",
    startDate: null,
    endDate: null,
    value: null,
    currency: "USD",
    theme: "dark",
    rooms: [],
    participants: [],
    ownerId: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 0,
  };
}

// ── Reducer ─────────────────────────────────────────────────────────────────

export function reduceEngagementEvents(
  events: EngagementEvent[],
  initialState?: EngagementState
): EngagementState {
  const sorted = [...events].sort((a, b) => a.sequence - b.sequence);

  if (sorted.length === 0 && !initialState) {
    throw new Error("Cannot reduce empty events without initial state");
  }

  const baseState = initialState ?? createEmptyEngagementState(sorted[0].engagementId);

  return sorted.reduce(applyEngagementEvent, baseState);
}

// ── Event Handlers ──────────────────────────────────────────────────────────

function applyEngagementEvent(
  state: EngagementState,
  event: EngagementEvent
): EngagementState {
  const base = {
    ...state,
    updatedAt: event.timestamp,
    version: event.sequence,
  };

  switch (event.type) {
    case "engagement_created":
      return {
        ...base,
        name: event.payload.name,
        clientId: event.payload.clientId ?? null,
        ownerId: event.payload.ownerId,
        rooms: event.payload.rooms.map((schema, idx) => ({
          ...schema,
          id: schema.id || `room_${idx}`,
          engagementId: state.id,
          blocks: [],
          version: 1,
          createdAt: event.timestamp,
          updatedAt: event.timestamp,
        })),
        createdAt: event.timestamp,
        phase: "intake",
      };

    case "engagement_updated":
      return {
        ...base,
        ...(event.payload.name !== undefined && { name: event.payload.name }),
        ...(event.payload.startDate !== undefined && { startDate: event.payload.startDate }),
        ...(event.payload.endDate !== undefined && { endDate: event.payload.endDate }),
        ...(event.payload.value !== undefined && { value: event.payload.value }),
        ...(event.payload.currency !== undefined && { currency: event.payload.currency }),
        ...(event.payload.theme !== undefined && { theme: event.payload.theme }),
      };

    case "engagement_phase_changed":
      return {
        ...base,
        phase: event.payload.toPhase,
      };

    case "engagement_archived":
      return {
        ...base,
        phase: "archived",
      };

    case "client_attached":
      return {
        ...base,
        clientId: event.payload.clientId,
      };

    case "client_detached":
      return {
        ...base,
        clientId: null,
      };

    case "participant_invited":
      return {
        ...base,
        participants: [
          ...state.participants,
          {
            id: event.payload.participantId,
            engagementId: state.id,
            name: event.payload.name,
            email: event.payload.email,
            role: event.payload.role,
            access: { canEditRooms: [], canViewRooms: [], canManageParticipants: false, canChangePhase: false, canExport: false },
            invitedAt: event.timestamp,
            invitedBy: event.payload.invitedBy,
          },
        ],
      };

    case "participant_joined":
      return {
        ...base,
        participants: state.participants.map((p) =>
          p.id === event.payload.participantId
            ? { ...p, userId: event.payload.userId, joinedAt: event.timestamp }
            : p
        ),
      };

    case "participant_removed":
      return {
        ...base,
        participants: state.participants.filter(
          (p) => p.id !== event.payload.participantId
        ),
      };

    case "participant_role_changed":
      return {
        ...base,
        participants: state.participants.map((p) =>
          p.id === event.payload.participantId
            ? { ...p, role: event.payload.toRole }
            : p
        ),
      };

    case "participant_access_updated":
      return {
        ...base,
        participants: state.participants.map((p) =>
          p.id === event.payload.participantId
            ? { ...p, access: event.payload.access }
            : p
        ),
      };

    case "room_added":
      return {
        ...base,
        rooms: [
          ...state.rooms,
          {
            ...event.payload.room,
            engagementId: state.id,
            blocks: [],
            version: 1,
            createdAt: event.timestamp,
            updatedAt: event.timestamp,
          },
        ],
      };

    case "room_updated":
      return {
        ...base,
        rooms: state.rooms.map((room) =>
          room.id === event.payload.roomId
            ? { ...room, ...event.payload.updates, updatedAt: event.timestamp }
            : room
        ),
      };

    case "room_removed":
      return {
        ...base,
        rooms: state.rooms
          .filter((room) => room.id !== event.payload.roomId)
          .map((room, idx) => ({ ...room, orderIndex: idx })),
      };

    case "room_visibility_changed":
      return {
        ...base,
        rooms: state.rooms.map((room) =>
          room.id === event.payload.roomId
            ? { ...room, visibility: event.payload.toVisibility as EngagementRoom["visibility"], updatedAt: event.timestamp }
            : room
        ),
      };

    case "rooms_reordered": {
      const roomMap = new Map(state.rooms.map((r) => [r.id, r]));
      const reordered = event.payload.roomIds
        .map((id) => roomMap.get(id))
        .filter((r): r is EngagementRoom => r !== undefined)
        .map((room, idx) => ({ ...room, orderIndex: idx }));
      return {
        ...base,
        rooms: reordered,
      };
    }

    case "block_added":
      return {
        ...base,
        rooms: state.rooms.map((room) =>
          room.id === event.payload.roomId
            ? {
                ...room,
                blocks: [
                  ...room.blocks,
                  { ...event.payload.block, orderIndex: room.blocks.length, version: 1 },
                ],
                updatedAt: event.timestamp,
              }
            : room
        ),
      };

    case "block_updated":
      return {
        ...base,
        rooms: state.rooms.map((room) =>
          room.id === event.payload.roomId
            ? {
                ...room,
                blocks: room.blocks.map((block) =>
                  block.id === event.payload.blockId
                    ? { ...block, ...event.payload.updates }
                    : block
                ),
                updatedAt: event.timestamp,
              }
            : room
        ),
      };

    case "block_removed":
      return {
        ...base,
        rooms: state.rooms.map((room) =>
          room.id === event.payload.roomId
            ? {
                ...room,
                blocks: room.blocks
                  .filter((b) => b.id !== event.payload.blockId)
                  .map((b, idx) => ({ ...b, orderIndex: idx })),
                updatedAt: event.timestamp,
              }
            : room
        ),
      };

    case "blocks_reordered":
      return {
        ...base,
        rooms: state.rooms.map((room) => {
          if (room.id !== event.payload.roomId) return room;
          const blockMap = new Map(room.blocks.map((b) => [b.id, b]));
          const reordered = event.payload.blockIds
            .map((id) => blockMap.get(id))
            .filter((b): b is EngagementBlock => b !== undefined)
            .map((block, idx) => ({ ...block, orderIndex: idx }));
          return { ...room, blocks: reordered, updatedAt: event.timestamp };
        }),
      };

    default:
      return state;
  }
}

// ── Validation ──────────────────────────────────────────────────────────────

export function validateEngagementEventSequence(events: EngagementEvent[]): boolean {
  if (events.length === 0) return true;

  const sorted = [...events].sort((a, b) => a.sequence - b.sequence);

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].sequence !== sorted[i - 1].sequence + 1) {
      return false;
    }
  }

  if (sorted[0].type !== "engagement_created") {
    return false;
  }

  return true;
}

// ── Projection Helpers ──────────────────────────────────────────────────────

export function getLatestEngagementEventTimestamp(events: EngagementEvent[]): string | null {
  if (events.length === 0) return null;
  return events.reduce((latest, e) =>
    e.timestamp > latest.timestamp ? e : latest
  ).timestamp;
}

export function getEngagementEventsByType(
  events: EngagementEvent[],
  type: EngagementEvent["type"]
): EngagementEvent[] {
  return events.filter((e) => e.type === type);
}
