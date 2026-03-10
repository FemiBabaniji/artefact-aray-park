"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { useC } from "@/hooks/useC";
import { useTheme } from "@/hooks/useC";
import { useCardColors } from "@/components/create/hooks";
import { ExpandedArtefact } from "@/components/create/components";
import { GuestArtefactCtx, type GuestArtefactContextValue } from "@/context/GuestArtefactContext";
import type { GuestArtefactState } from "@/types/artefact";
import type { ArtefactState } from "@/types/events";
import { MOCK_MEMBER_ARTEFACTS, type DirectoryMember } from "@/lib/data/community";

type DirectoryMemberViewProps = {
  member: DirectoryMember;
  onClose: () => void;
  C: ReturnType<typeof useC>;
};

// Map lifecycle to color index
const LIFECYCLE_COLOR_MAP: Record<string, number> = {
  active: 0,
  new: 1,
  dormant: 3,
};

function MemberArtefactProvider({
  member,
  children,
}: {
  member: DirectoryMember;
  children: React.ReactNode;
}) {
  const [activeRoomId, setActiveRoomId] = useState<string | null>("identity");

  // Look up rich artefact data or fall back to minimal
  const artefactData = MOCK_MEMBER_ARTEFACTS[member.id];

  const mockState: GuestArtefactState = useMemo(() => {
    if (artefactData) {
      return {
        sessionId: member.id,
        createdAt: "2026-03-10T00:00:00Z",
        identity: artefactData.identity,
        rooms: artefactData.rooms,
      };
    }
    // Fallback to minimal generation for unknown members
    return {
      sessionId: member.id,
      createdAt: "2026-03-10T00:00:00Z",
      identity: {
        name: member.name,
        title: `${member.role} at ${member.company}`,
        bio: member.bio,
        location: "",
        skills: member.skills,
        links: [],
      },
      rooms: [
        { id: "identity", key: "identity", label: "Identity", prompt: "", visibility: "public" as const, orderIndex: 0, blocks: [{ id: "1", blockType: "text" as const, content: member.bio, orderIndex: 0 }] },
        { id: "startup", key: "startup", label: member.company, prompt: "", visibility: "public" as const, orderIndex: 1, blocks: [{ id: "2", blockType: "text" as const, content: `Stage: ${member.stage}`, orderIndex: 0 }] },
        { id: "pitch", key: "pitch", label: "Pitch", prompt: "", visibility: "public" as const, orderIndex: 2, blocks: [] },
      ],
    };
  }, [member, artefactData]);

  const mockArtefactState: ArtefactState = useMemo(
    () => ({
      id: member.id,
      sessionId: member.id,
      ownerId: member.id,
      slug: null,
      lifecycleState: "claimed" as const,
      identity: mockState.identity,
      rooms: mockState.rooms,
      createdAt: "2026-03-10T00:00:00Z",
      updatedAt: "2026-03-10T00:00:00Z",
      version: 1,
    }),
    [member.id, mockState]
  );

  const value: GuestArtefactContextValue = useMemo(
    () => ({
      state: mockState,
      isLoaded: true,
      activeRoomId,
      setActiveRoomId,
      artefactState: mockArtefactState,
      events: [],
      version: 1,
      lifecycleState: "claimed" as const,
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
      getActiveRoom: () => mockState.rooms.find((r) => r.id === activeRoomId),
      getRoomBlockCount: () => mockState.rooms.reduce((acc, r) => acc + r.blocks.length, 0),
      clearState: () => {},
    }),
    [mockState, mockArtefactState, activeRoomId]
  );

  return <GuestArtefactCtx.Provider value={value}>{children}</GuestArtefactCtx.Provider>;
}

export function DirectoryMemberView({ member, onClose, C }: DirectoryMemberViewProps) {
  const { dark } = useTheme();
  const theme = useCardColors(C);

  const colorIndex = LIFECYCLE_COLOR_MAP[member.lifecycle] || 0;
  const color = theme.colors[colorIndex % theme.colors.length];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Back button */}
      <div style={{
        padding: "12px 0",
        marginBottom: 8,
      }}>
        <motion.button
          onClick={onClose}
          whileHover={{ color: C.t1 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            fontSize: 12,
            color: C.t3,
            cursor: "pointer",
            padding: 0,
          }}
        >
          <span style={{ fontSize: 14 }}>&larr;</span>
          Back to dashboard
        </motion.button>
      </div>

      {/* Artefact View */}
      <div style={{ flex: 1 }}>
        <MemberArtefactProvider member={member}>
          <ExpandedArtefact
            accent={color.accent}
            cardBg={color.card}
            colorId={color.id}
            onColorChange={() => {}}
            onCollapse={onClose}
            theme={theme}
            dark={dark}
            onToggleTheme={() => {}}
            readOnly
          />
        </MemberArtefactProvider>
      </div>
    </motion.div>
  );
}
