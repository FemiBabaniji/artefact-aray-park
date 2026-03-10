// ════════════════════════════════════════════════════════════════════════════
// Event Store (P0)
// Manages append-only event log with localStorage + API support
// ════════════════════════════════════════════════════════════════════════════

import type {
  ArtefactEvent,
  ArtefactEventPayload,
  EventStore,
  ArtefactState,
} from "@/types/events";
import { createEvent, createArtefactId } from "@/types/events";
import { reduceEvents, createEmptyState } from "./reducer";
import type { Identity, StandaloneRoom, StandaloneBlock } from "@/types/artefact";
import { DEFAULT_ROOMS, DEFAULT_IDENTITY } from "@/lib/guest/defaults";

// ── Storage Keys ────────────────────────────────────────────────────────────

export const EVENT_STORE_KEY = "artefact_events_v1";

// ── Local Storage Operations ────────────────────────────────────────────────

export function loadEventStore(): EventStore | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(EVENT_STORE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as EventStore;
    if (parsed.artefactId && Array.isArray(parsed.events)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveEventStore(store: EventStore): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(EVENT_STORE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or unavailable
  }
}

export function clearEventStore(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(EVENT_STORE_KEY);
  } catch {
    // Ignore
  }
}

// ── Event Store Factory ─────────────────────────────────────────────────────

export function createEventStore(artefactId?: string): EventStore {
  return {
    artefactId: artefactId ?? createArtefactId(),
    events: [],
    lastSequence: 0,
  };
}

// ── Event Appending ─────────────────────────────────────────────────────────

export function appendEvent(
  store: EventStore,
  eventData: ArtefactEventPayload,
  actorId?: string
): { store: EventStore; event: ArtefactEvent } {
  const nextSequence = store.lastSequence + 1;
  const event = createEvent(store.artefactId, nextSequence, eventData, actorId);

  const newStore: EventStore = {
    ...store,
    events: [...store.events, event],
    lastSequence: nextSequence,
  };

  return { store: newStore, event };
}

// ── Compute State ───────────────────────────────────────────────────────────

export function computeState(store: EventStore): ArtefactState {
  if (store.events.length === 0) {
    return createEmptyState(store.artefactId);
  }
  return reduceEvents(store.events);
}

// ── Initialize Guest Artefact ───────────────────────────────────────────────

export function initializeGuestArtefact(): EventStore {
  const artefactId = createArtefactId();
  const sessionId = crypto.randomUUID();

  // Create default rooms with unique IDs
  const rooms: StandaloneRoom[] = DEFAULT_ROOMS.map((room, idx) => ({
    ...room,
    id: `room_${room.key}_${crypto.randomUUID().slice(0, 8)}`,
    orderIndex: idx,
    blocks: [],
  }));

  const store = createEventStore(artefactId);
  const { store: newStore } = appendEvent(store, {
    type: "artefact_created",
    payload: {
      sessionId,
      identity: { ...DEFAULT_IDENTITY },
      rooms,
    },
  });

  return newStore;
}

// ── Event Builders (Convenience) ────────────────────────────────────────────

export const EventBuilders = {
  identityUpdated: (updates: Partial<Identity>): ArtefactEventPayload => ({
    type: "identity_updated",
    payload: updates,
  }),

  roomAdded: (room: StandaloneRoom): ArtefactEventPayload => ({
    type: "room_added",
    payload: { room },
  }),

  roomUpdated: (
    roomId: string,
    updates: Partial<Omit<StandaloneRoom, "id" | "blocks">>
  ): ArtefactEventPayload => ({
    type: "room_updated",
    payload: { roomId, updates },
  }),

  roomRemoved: (roomId: string): ArtefactEventPayload => ({
    type: "room_removed",
    payload: { roomId },
  }),

  roomsReordered: (roomIds: string[]): ArtefactEventPayload => ({
    type: "rooms_reordered",
    payload: { roomIds },
  }),

  blockAdded: (roomId: string, block: StandaloneBlock): ArtefactEventPayload => ({
    type: "block_added",
    payload: { roomId, block },
  }),

  blockUpdated: (
    roomId: string,
    blockId: string,
    updates: Partial<Omit<StandaloneBlock, "id">>
  ): ArtefactEventPayload => ({
    type: "block_updated",
    payload: { roomId, blockId, updates },
  }),

  blockRemoved: (roomId: string, blockId: string): ArtefactEventPayload => ({
    type: "block_removed",
    payload: { roomId, blockId },
  }),

  blocksReordered: (roomId: string, blockIds: string[]): ArtefactEventPayload => ({
    type: "blocks_reordered",
    payload: { roomId, blockIds },
  }),

  claimed: (ownerId: string, email?: string): ArtefactEventPayload => ({
    type: "artefact_claimed",
    payload: { ownerId, email },
  }),

  published: (slug: string): ArtefactEventPayload => ({
    type: "artefact_published",
    payload: { slug },
  }),

  archived: (reason?: string): ArtefactEventPayload => ({
    type: "artefact_archived",
    payload: { reason },
  }),
};
