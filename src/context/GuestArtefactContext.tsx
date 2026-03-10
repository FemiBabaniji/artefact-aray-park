"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { useEventSourcedArtefact } from "@/hooks/useEventSourcedArtefact";
import type {
  GuestArtefactState,
  Identity,
  StandaloneRoom,
  StandaloneBlock,
} from "@/types/artefact";
import type { ArtefactState, ArtefactEvent, LifecycleState } from "@/types/events";
import { createInitialGuestState } from "@/lib/guest/defaults";

// ── Context Type ─────────────────────────────────────────────────────────────

export type GuestArtefactContextValue = {
  // State
  state: GuestArtefactState;
  isLoaded: boolean;
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;

  // Event-sourced state (P0)
  artefactState: ArtefactState;
  events: ArtefactEvent[];
  version: number;
  lifecycleState: LifecycleState;

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

  // Lifecycle (P0)
  claim: (ownerId: string, email?: string) => void;
  publish: (slug: string) => void;
  archive: (reason?: string) => void;

  // Helpers
  getActiveRoom: () => StandaloneRoom | undefined;
  getRoomBlockCount: () => number;
  clearState: () => void;
};

// ── Default Context ──────────────────────────────────────────────────────────

const defaultArtefactState: ArtefactState = {
  id: "",
  sessionId: "",
  ownerId: null,
  slug: null,
  lifecycleState: "draft",
  identity: { name: "", title: "", bio: "", location: "", skills: [], links: [] },
  rooms: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 0,
};

const defaultContext: GuestArtefactContextValue = {
  state: createInitialGuestState(),
  isLoaded: false,
  activeRoomId: null,
  setActiveRoomId: () => {},
  artefactState: defaultArtefactState,
  events: [],
  version: 0,
  lifecycleState: "draft",
  updateIdentity: () => {},
  updateRoom: () => {},
  addRoom: () => "",
  removeRoom: () => {},
  reorderRooms: () => {},
  updateBlocks: () => {},
  addBlock: () => {},
  removeBlock: () => {},
  claim: () => {},
  publish: () => {},
  archive: () => {},
  getActiveRoom: () => undefined,
  getRoomBlockCount: () => 0,
  clearState: () => {},
};

// ── Context ──────────────────────────────────────────────────────────────────

export const GuestArtefactCtx = createContext<GuestArtefactContextValue>(defaultContext);

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useGuestArtefactContext() {
  return useContext(GuestArtefactCtx);
}

// ── Provider ─────────────────────────────────────────────────────────────────

type GuestArtefactProviderProps = {
  children: ReactNode;
};

export function GuestArtefactProvider({ children }: GuestArtefactProviderProps) {
  const guest = useEventSourcedArtefact();
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
    artefactState: guest.artefactState,
    events: guest.events,
    version: guest.version,
    lifecycleState: guest.artefactState.lifecycleState,
    updateIdentity: guest.updateIdentity,
    updateRoom: guest.updateRoom,
    addRoom: guest.addRoom,
    removeRoom: guest.removeRoom,
    reorderRooms: guest.reorderRooms,
    updateBlocks: guest.updateBlocks,
    addBlock: guest.addBlock,
    removeBlock: guest.removeBlock,
    claim: guest.claim,
    publish: guest.publish,
    archive: guest.archive,
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
