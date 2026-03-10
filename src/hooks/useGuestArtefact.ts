"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  GuestArtefactState,
  Identity,
  StandaloneRoom,
  StandaloneBlock,
} from "@/types/artefact";
import {
  GUEST_STORAGE_KEY,
  createInitialGuestState,
} from "@/lib/guest/defaults";

// ── Hook Return Type ─────────────────────────────────────────────────────────

type UseGuestArtefactReturn = {
  state: GuestArtefactState;
  isLoaded: boolean;

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

  // State management
  clearState: () => void;
  getState: () => GuestArtefactState;
};

// ── Hook Implementation ──────────────────────────────────────────────────────

export function useGuestArtefact(): UseGuestArtefactReturn {
  const [state, setState] = useState<GuestArtefactState>(createInitialGuestState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(GUEST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GuestArtefactState;
        // Validate basic structure
        if (parsed.sessionId && parsed.identity && Array.isArray(parsed.rooms)) {
          setState(parsed);
        }
      }
    } catch {
      // Invalid data, use defaults
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage on state change
  const persist = useCallback((newState: GuestArtefactState) => {
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(newState));
    } catch {
      // Storage full or unavailable
    }
  }, []);

  // ── Identity ───────────────────────────────────────────────────────────────

  const updateIdentity = useCallback((updates: Partial<Identity>) => {
    setState((prev) => {
      const next = {
        ...prev,
        identity: { ...prev.identity, ...updates },
      };
      persist(next);
      return next;
    });
  }, [persist]);

  // ── Rooms ──────────────────────────────────────────────────────────────────

  const updateRoom = useCallback((roomId: string, updates: Partial<StandaloneRoom>) => {
    setState((prev) => {
      const next = {
        ...prev,
        rooms: prev.rooms.map((room) =>
          room.id === roomId ? { ...room, ...updates } : room
        ),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const addRoom = useCallback((label: string, prompt?: string): string => {
    const newRoom: StandaloneRoom = {
      id: `room_custom_${crypto.randomUUID().slice(0, 8)}`,
      key: label.toLowerCase().replace(/\s+/g, "_"),
      label,
      prompt,
      visibility: "public",
      orderIndex: state.rooms.length,
      blocks: [],
    };

    setState((prev) => {
      const next = {
        ...prev,
        rooms: [...prev.rooms, newRoom],
      };
      persist(next);
      return next;
    });

    return newRoom.id;
  }, [state.rooms.length, persist]);

  const removeRoom = useCallback((roomId: string) => {
    setState((prev) => {
      const next = {
        ...prev,
        rooms: prev.rooms
          .filter((room) => room.id !== roomId)
          .map((room, idx) => ({ ...room, orderIndex: idx })),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const reorderRooms = useCallback((roomIds: string[]) => {
    setState((prev) => {
      const roomMap = new Map(prev.rooms.map((r) => [r.id, r]));
      const reordered = roomIds
        .map((id) => roomMap.get(id))
        .filter((r): r is StandaloneRoom => r !== undefined)
        .map((room, idx) => ({ ...room, orderIndex: idx }));

      const next = { ...prev, rooms: reordered };
      persist(next);
      return next;
    });
  }, [persist]);

  // ── Blocks ─────────────────────────────────────────────────────────────────

  const updateBlocks = useCallback((roomId: string, blocks: StandaloneBlock[]) => {
    setState((prev) => {
      const next = {
        ...prev,
        rooms: prev.rooms.map((room) =>
          room.id === roomId
            ? { ...room, blocks: blocks.map((b, idx) => ({ ...b, orderIndex: idx })) }
            : room
        ),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const addBlock = useCallback((roomId: string, block: StandaloneBlock) => {
    setState((prev) => {
      const next = {
        ...prev,
        rooms: prev.rooms.map((room) =>
          room.id === roomId
            ? {
                ...room,
                blocks: [
                  ...room.blocks,
                  { ...block, orderIndex: room.blocks.length },
                ],
              }
            : room
        ),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const removeBlock = useCallback((roomId: string, blockId: string) => {
    setState((prev) => {
      const next = {
        ...prev,
        rooms: prev.rooms.map((room) =>
          room.id === roomId
            ? {
                ...room,
                blocks: room.blocks
                  .filter((b) => b.id !== blockId)
                  .map((b, idx) => ({ ...b, orderIndex: idx })),
              }
            : room
        ),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  // ── State Management ───────────────────────────────────────────────────────

  const clearState = useCallback(() => {
    const fresh = createInitialGuestState();
    setState(fresh);
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const getState = useCallback(() => state, [state]);

  return {
    state,
    isLoaded,
    updateIdentity,
    updateRoom,
    addRoom,
    removeRoom,
    reorderRooms,
    updateBlocks,
    addBlock,
    removeBlock,
    clearState,
    getState,
  };
}
