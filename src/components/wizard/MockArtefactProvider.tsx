"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import { GuestArtefactCtx, type GuestArtefactContextValue } from "@/context/GuestArtefactContext";
import type { GuestArtefactState, StandaloneRoom, Identity } from "@/types/artefact";
import type { ArtefactState } from "@/types/events";

type MockArtefactProviderProps = {
  children: ReactNode;
  rooms: StandaloneRoom[];
  identity: Identity;
  focusedRoomId?: string | null;
};

/**
 * Provides a mock GuestArtefactContext for preview-only mode.
 * All mutation functions are no-ops.
 */
export function MockArtefactProvider({
  children,
  rooms,
  identity,
  focusedRoomId,
}: MockArtefactProviderProps) {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(rooms[0]?.id || null);

  // Sync with focused room from parent
  useEffect(() => {
    if (focusedRoomId !== undefined) {
      setActiveRoomId(focusedRoomId || rooms[0]?.id || null);
    }
  }, [focusedRoomId, rooms]);

  const state: GuestArtefactState = useMemo(
    () => ({
      sessionId: "preview",
      createdAt: "2024-01-01T00:00:00.000Z",
      identity,
      rooms,
    }),
    [identity, rooms]
  );

  const artefactState: ArtefactState = useMemo(
    () => ({
      id: "preview",
      sessionId: "preview",
      ownerId: null,
      slug: null,
      lifecycleState: "draft" as const,
      identity,
      rooms,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      version: 0,
    }),
    [identity, rooms]
  );

  const value: GuestArtefactContextValue = useMemo(
    () => ({
      state,
      isLoaded: true,
      activeRoomId,
      setActiveRoomId,
      artefactState,
      events: [],
      version: 0,
      lifecycleState: "draft" as const,
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
      getActiveRoom: () => rooms.find((r) => r.id === activeRoomId),
      getRoomBlockCount: () => rooms.reduce((acc, r) => acc + r.blocks.length, 0),
      clearState: () => {},
    }),
    [state, activeRoomId, artefactState, rooms]
  );

  return <GuestArtefactCtx.Provider value={value}>{children}</GuestArtefactCtx.Provider>;
}
