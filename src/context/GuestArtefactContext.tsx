"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useGuestArtefact } from "@/hooks/useGuestArtefact";
import type {
  GuestArtefactState,
  Identity,
  StandaloneRoom,
  StandaloneBlock,
} from "@/types/artefact";
import { createInitialGuestState } from "@/lib/guest/defaults";

// ── Context Type ─────────────────────────────────────────────────────────────

type GuestArtefactContextValue = {
  // State
  state: GuestArtefactState;
  isLoaded: boolean;
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;

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

  // Helpers
  getActiveRoom: () => StandaloneRoom | undefined;
  getRoomBlockCount: () => number;
  clearState: () => void;
};

// ── Default Context ──────────────────────────────────────────────────────────

const defaultContext: GuestArtefactContextValue = {
  state: createInitialGuestState(),
  isLoaded: false,
  activeRoomId: null,
  setActiveRoomId: () => {},
  updateIdentity: () => {},
  updateRoom: () => {},
  addRoom: () => "",
  removeRoom: () => {},
  reorderRooms: () => {},
  updateBlocks: () => {},
  addBlock: () => {},
  removeBlock: () => {},
  getActiveRoom: () => undefined,
  getRoomBlockCount: () => 0,
  clearState: () => {},
};

// ── Context ──────────────────────────────────────────────────────────────────

const GuestArtefactCtx = createContext<GuestArtefactContextValue>(defaultContext);

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useGuestArtefactContext() {
  return useContext(GuestArtefactCtx);
}

// ── Provider ─────────────────────────────────────────────────────────────────

type GuestArtefactProviderProps = {
  children: ReactNode;
};

export function GuestArtefactProvider({ children }: GuestArtefactProviderProps) {
  const guest = useGuestArtefact();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  // Set initial active room once loaded
  const handleSetActiveRoom = useCallback((id: string | null) => {
    setActiveRoomId(id);
  }, []);

  // If no active room and we have rooms, default to first room
  const effectiveActiveRoomId = activeRoomId ?? guest.state.rooms[0]?.id ?? null;

  const getActiveRoom = useCallback(() => {
    return guest.state.rooms.find((r) => r.id === effectiveActiveRoomId);
  }, [guest.state.rooms, effectiveActiveRoomId]);

  const getRoomBlockCount = useCallback(() => {
    return guest.state.rooms.reduce((acc, room) => acc + room.blocks.length, 0);
  }, [guest.state.rooms]);

  const value: GuestArtefactContextValue = {
    state: guest.state,
    isLoaded: guest.isLoaded,
    activeRoomId: effectiveActiveRoomId,
    setActiveRoomId: handleSetActiveRoom,
    updateIdentity: guest.updateIdentity,
    updateRoom: guest.updateRoom,
    addRoom: guest.addRoom,
    removeRoom: guest.removeRoom,
    reorderRooms: guest.reorderRooms,
    updateBlocks: guest.updateBlocks,
    addBlock: guest.addBlock,
    removeBlock: guest.removeBlock,
    getActiveRoom,
    getRoomBlockCount,
    clearState: guest.clearState,
  };

  return (
    <GuestArtefactCtx.Provider value={value}>
      {children}
    </GuestArtefactCtx.Provider>
  );
}
