"use client";

// ════════════════════════════════════════════════════════════════════════════
// Event-Sourced Artefact Hook (P0)
// Drop-in replacement for useGuestArtefact with event sourcing
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ArtefactState,
  EventStore,
  ArtefactEvent,
} from "@/types/events";
import type {
  Identity,
  StandaloneRoom,
  StandaloneBlock,
  GuestArtefactState,
} from "@/types/artefact";
import {
  loadEventStore,
  saveEventStore,
  clearEventStore,
  initializeGuestArtefact,
  appendEvent,
  computeState,
  EventBuilders,
} from "@/lib/artefact/event-store";

// ── Return Type ─────────────────────────────────────────────────────────────

type UseEventSourcedArtefactReturn = {
  // Computed state (for rendering)
  state: GuestArtefactState;
  artefactState: ArtefactState;
  isLoaded: boolean;

  // Event log access
  events: ArtefactEvent[];
  version: number;

  // Identity
  updateIdentity: (updates: Partial<Identity>) => void;

  // Rooms
  updateRoom: (roomId: string, updates: Partial<StandaloneRoom>) => void;
  addRoom: (label: string, prompt?: string) => string;
  removeRoom: (roomId: string) => void;
  reorderRooms: (roomIds: string[]) => void;

  // Blocks
  updateBlocks: (roomId: string, blocks: StandaloneBlock[]) => void;
  addBlock: (roomId: string, block: StandaloneBlock) => void;
  removeBlock: (roomId: string, blockId: string) => void;

  // Lifecycle
  claim: (ownerId: string, email?: string) => void;
  publish: (slug: string) => void;
  archive: (reason?: string) => void;

  // State management
  clearState: () => void;
  getState: () => GuestArtefactState;
};

// ── Hook Implementation ─────────────────────────────────────────────────────

export function useEventSourcedArtefact(): UseEventSourcedArtefactReturn {
  const [store, setStore] = useState<EventStore | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const storeRef = useRef<EventStore | null>(null);

  // Hydrate from localStorage after mount
  useEffect(() => {
    let loaded = loadEventStore();

    if (!loaded) {
      // No existing store, create fresh guest artefact
      loaded = initializeGuestArtefact();
      saveEventStore(loaded);
    }

    storeRef.current = loaded;
    setStore(loaded);
    setIsLoaded(true);
  }, []);

  // Dispatch event and persist
  const dispatch = useCallback(
    (builder: ReturnType<typeof EventBuilders[keyof typeof EventBuilders]>) => {
      if (!storeRef.current) return;

      const { store: newStore } = appendEvent(storeRef.current, builder);
      storeRef.current = newStore;
      setStore(newStore);
      saveEventStore(newStore);
    },
    []
  );

  // Compute derived state
  const artefactState = store ? computeState(store) : null;

  // Convert to legacy GuestArtefactState format for compatibility
  const guestState: GuestArtefactState = artefactState
    ? {
        sessionId: artefactState.sessionId,
        createdAt: artefactState.createdAt,
        identity: artefactState.identity,
        rooms: artefactState.rooms,
      }
    : {
        sessionId: "",
        createdAt: new Date().toISOString(),
        identity: {
          name: "",
          title: "",
          bio: "",
          location: "",
          skills: [],
          links: [],
        },
        rooms: [],
      };

  // ── Identity ────────────────────────────────────────────────────────────────

  const updateIdentity = useCallback(
    (updates: Partial<Identity>) => {
      dispatch(EventBuilders.identityUpdated(updates));
    },
    [dispatch]
  );

  // ── Rooms ───────────────────────────────────────────────────────────────────

  const addRoom = useCallback(
    (label: string, prompt?: string): string => {
      const newRoom: StandaloneRoom = {
        id: `room_custom_${crypto.randomUUID().slice(0, 8)}`,
        key: label.toLowerCase().replace(/\s+/g, "_"),
        label,
        prompt,
        visibility: "public",
        orderIndex: artefactState?.rooms.length ?? 0,
        blocks: [],
      };

      dispatch(EventBuilders.roomAdded(newRoom));
      return newRoom.id;
    },
    [dispatch, artefactState?.rooms.length]
  );

  const updateRoom = useCallback(
    (roomId: string, updates: Partial<StandaloneRoom>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, blocks, ...safeUpdates } = updates as StandaloneRoom;
      dispatch(EventBuilders.roomUpdated(roomId, safeUpdates));
    },
    [dispatch]
  );

  const removeRoom = useCallback(
    (roomId: string) => {
      dispatch(EventBuilders.roomRemoved(roomId));
    },
    [dispatch]
  );

  const reorderRooms = useCallback(
    (roomIds: string[]) => {
      dispatch(EventBuilders.roomsReordered(roomIds));
    },
    [dispatch]
  );

  // ── Blocks ──────────────────────────────────────────────────────────────────

  const addBlock = useCallback(
    (roomId: string, block: StandaloneBlock) => {
      dispatch(EventBuilders.blockAdded(roomId, block));
    },
    [dispatch]
  );

  const updateBlocks = useCallback(
    (roomId: string, blocks: StandaloneBlock[]) => {
      // This replaces all blocks - emit reorder + updates
      // For simplicity, emit individual updates for changed blocks
      const currentRoom = artefactState?.rooms.find((r) => r.id === roomId);
      if (!currentRoom) return;

      // First, reorder
      dispatch(EventBuilders.blocksReordered(roomId, blocks.map((b) => b.id)));

      // Then update any changed blocks
      blocks.forEach((block, idx) => {
        const existing = currentRoom.blocks.find((b) => b.id === block.id);
        if (!existing) {
          // New block
          dispatch(EventBuilders.blockAdded(roomId, { ...block, orderIndex: idx }));
        } else if (JSON.stringify(existing) !== JSON.stringify(block)) {
          // Updated block
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...updates } = block;
          dispatch(EventBuilders.blockUpdated(roomId, block.id, updates));
        }
      });

      // Remove deleted blocks
      currentRoom.blocks.forEach((existing) => {
        if (!blocks.find((b) => b.id === existing.id)) {
          dispatch(EventBuilders.blockRemoved(roomId, existing.id));
        }
      });
    },
    [dispatch, artefactState?.rooms]
  );

  const removeBlock = useCallback(
    (roomId: string, blockId: string) => {
      dispatch(EventBuilders.blockRemoved(roomId, blockId));
    },
    [dispatch]
  );

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  const claim = useCallback(
    (ownerId: string, email?: string) => {
      dispatch(EventBuilders.claimed(ownerId, email));
    },
    [dispatch]
  );

  const publish = useCallback(
    (slug: string) => {
      dispatch(EventBuilders.published(slug));
    },
    [dispatch]
  );

  const archive = useCallback(
    (reason?: string) => {
      dispatch(EventBuilders.archived(reason));
    },
    [dispatch]
  );

  // ── State Management ────────────────────────────────────────────────────────

  const clearState = useCallback(() => {
    clearEventStore();
    const fresh = initializeGuestArtefact();
    storeRef.current = fresh;
    setStore(fresh);
    saveEventStore(fresh);
  }, []);

  const getState = useCallback(() => guestState, [guestState]);

  return {
    state: guestState,
    artefactState: artefactState ?? {
      id: "",
      sessionId: "",
      ownerId: null,
      slug: null,
      lifecycleState: "draft",
      identity: guestState.identity,
      rooms: guestState.rooms,
      createdAt: guestState.createdAt,
      updatedAt: guestState.createdAt,
      version: 0,
    },
    isLoaded,
    events: store?.events ?? [],
    version: store?.lastSequence ?? 0,
    updateIdentity,
    updateRoom,
    addRoom,
    removeRoom,
    reorderRooms,
    updateBlocks,
    addBlock,
    removeBlock,
    claim,
    publish,
    archive,
    clearState,
    getState,
  };
}
