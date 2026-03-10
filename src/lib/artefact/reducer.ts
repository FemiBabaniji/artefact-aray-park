// ════════════════════════════════════════════════════════════════════════════
// Artefact State Reducer (P0)
// Computes current state by reducing event log: state = reduce(events)
// ════════════════════════════════════════════════════════════════════════════

import type {
  ArtefactEvent,
  ArtefactState,
  LifecycleState,
} from "@/types/events";
import type { Identity, StandaloneRoom } from "@/types/artefact";
import { DEFAULT_IDENTITY } from "@/types/artefact";

// ── Initial State ───────────────────────────────────────────────────────────

export function createEmptyState(artefactId: string): ArtefactState {
  return {
    id: artefactId,
    sessionId: "",
    ownerId: null,
    slug: null,
    lifecycleState: "draft",
    identity: { ...DEFAULT_IDENTITY },
    rooms: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 0,
  };
}

// ── Reducer ─────────────────────────────────────────────────────────────────

export function reduceEvents(
  events: ArtefactEvent[],
  initialState?: ArtefactState
): ArtefactState {
  // Sort events by sequence to ensure deterministic ordering
  const sorted = [...events].sort((a, b) => a.sequence - b.sequence);

  if (sorted.length === 0 && !initialState) {
    throw new Error("Cannot reduce empty events without initial state");
  }

  const baseState = initialState ?? createEmptyState(sorted[0].artefactId);

  return sorted.reduce(applyEvent, baseState);
}

// ── Event Handlers ──────────────────────────────────────────────────────────

function applyEvent(state: ArtefactState, event: ArtefactEvent): ArtefactState {
  const base = {
    ...state,
    updatedAt: event.timestamp,
    version: event.sequence,
  };

  switch (event.type) {
    case "artefact_created":
      return {
        ...base,
        sessionId: event.payload.sessionId,
        identity: event.payload.identity,
        rooms: event.payload.rooms,
        createdAt: event.timestamp,
        lifecycleState: "draft",
      };

    case "artefact_claimed":
      // ownerId is immutable once set
      if (state.ownerId !== null) {
        console.warn("Attempted to re-claim artefact with existing owner");
        return state;
      }
      return {
        ...base,
        ownerId: event.payload.ownerId,
        lifecycleState: "claimed",
      };

    case "artefact_published":
      return {
        ...base,
        slug: event.payload.slug,
        lifecycleState: "published",
      };

    case "artefact_archived":
      return {
        ...base,
        lifecycleState: "archived",
      };

    case "identity_updated":
      return {
        ...base,
        identity: { ...state.identity, ...event.payload },
      };

    case "room_added":
      return {
        ...base,
        rooms: [...state.rooms, event.payload.room],
      };

    case "room_updated":
      return {
        ...base,
        rooms: state.rooms.map((room) =>
          room.id === event.payload.roomId
            ? { ...room, ...event.payload.updates }
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

    case "rooms_reordered": {
      const roomMap = new Map(state.rooms.map((r) => [r.id, r]));
      const reordered = event.payload.roomIds
        .map((id) => roomMap.get(id))
        .filter((r): r is StandaloneRoom => r !== undefined)
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
                  { ...event.payload.block, orderIndex: room.blocks.length },
                ],
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
              }
            : room
        ),
      };

    case "blocks_reordered": {
      return {
        ...base,
        rooms: state.rooms.map((room) => {
          if (room.id !== event.payload.roomId) return room;
          const blockMap = new Map(room.blocks.map((b) => [b.id, b]));
          const reordered = event.payload.blockIds
            .map((id) => blockMap.get(id))
            .filter((b): b is (typeof room.blocks)[number] => b !== undefined)
            .map((block, idx) => ({ ...block, orderIndex: idx }));
          return { ...room, blocks: reordered };
        }),
      };
    }

    default:
      // Unknown event type, return state unchanged
      return state;
  }
}

// ── Validation ──────────────────────────────────────────────────────────────

export function validateEventSequence(events: ArtefactEvent[]): boolean {
  if (events.length === 0) return true;

  const sorted = [...events].sort((a, b) => a.sequence - b.sequence);

  // Check for gaps in sequence
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].sequence !== sorted[i - 1].sequence + 1) {
      return false;
    }
  }

  // First event should be artefact_created
  if (sorted[0].type !== "artefact_created") {
    return false;
  }

  return true;
}

// ── Projection Helpers ──────────────────────────────────────────────────────

export function getLatestEventTimestamp(events: ArtefactEvent[]): string | null {
  if (events.length === 0) return null;
  return events.reduce((latest, e) =>
    e.timestamp > latest.timestamp ? e : latest
  ).timestamp;
}

export function getEventsByType(
  events: ArtefactEvent[],
  type: ArtefactEvent["type"]
): ArtefactEvent[] {
  return events.filter((e) => e.type === type);
}
