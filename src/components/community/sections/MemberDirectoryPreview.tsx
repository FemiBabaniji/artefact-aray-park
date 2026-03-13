"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC, useTheme } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";
import { CompactCard, ExpandedArtefact, useCardColors } from "@/components/artefact";
import { GuestArtefactCtx, type GuestArtefactContextValue } from "@/context/GuestArtefactContext";
import type { GuestArtefactState } from "@/types/artefact";
import type { ArtefactState } from "@/types/events";
import { DIRECTORY_MEMBERS, MOCK_MEMBER_ARTEFACTS, searchCommunityMembers, type DirectoryMember } from "@/lib/data/community";

// ── Mock Member Type (re-export for compatibility) ──────────────────────────

type MockMember = DirectoryMember;

// Map lifecycle to color index for variety
const LIFECYCLE_COLOR_MAP: Record<string, number> = {
  active: 0,
  new: 1,
  dormant: 3,
};

// ── Mock Provider for ExpandedArtefact ──────────────────────────────────────

function MemberArtefactProvider({
  member,
  children,
}: {
  member: MockMember;
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

// ── List Row (Compact View) ─────────────────────────────────────────────────

function MemberRow({
  member,
  onClick,
  index,
  accent,
}: {
  member: MockMember;
  onClick: () => void;
  index: number;
  accent: string;
}) {
  const C = useC();
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  const getEngagementColor = () => {
    if (member.engagement >= 70) return C.green;
    if (member.engagement >= 40) return C.amber;
    return "#ef4444";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ ...SPF, delay: index * 0.02 }}
      onClick={onClick}
      whileHover={{ background: C.edge }}
      style={{
        display: "grid",
        gridTemplateColumns: "28px 1fr 60px 50px 50px",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderBottom: `1px solid ${C.sep}`,
        cursor: "pointer",
      }}
    >
      <motion.div
        animate={{ background: accent }}
        transition={{ duration: 0.28 }}
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
          color: "rgba(0,0,0,0.5)",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {initials}
      </motion.div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: C.t1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {member.name}
        </div>
        <div
          style={{
            fontSize: 9,
            color: C.t3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {member.company}
        </div>
      </div>

      <span
        style={{
          fontSize: 9,
          color: C.t3,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {member.stage}
      </span>

      <span
        style={{
          fontSize: 8,
          fontWeight: 500,
          color:
            member.lifecycle === "active"
              ? C.green
              : member.lifecycle === "new"
              ? C.blue
              : C.amber,
          fontFamily: "'DM Mono', monospace",
          textTransform: "uppercase",
        }}
      >
        {member.lifecycle}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div
          style={{
            flex: 1,
            height: 3,
            background: C.sep,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${member.engagement}%` }}
            transition={{ duration: 0.4, delay: index * 0.02 }}
            style={{
              height: "100%",
              background: getEngagementColor(),
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── AI Search Bar ───────────────────────────────────────────────────────────

function AISearchBar({
  query,
  setQuery,
  isSearching,
  appliedFilters,
}: {
  query: string;
  setQuery: (q: string) => void;
  isSearching: boolean;
  appliedFilters: string | null;
}) {
  const C = useC();

  return (
    <div style={{ padding: "8px 14px", borderBottom: `1px solid ${C.sep}` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontSize: 10,
            color: C.t2,
            outline: "none",
            fontFamily: "'DM Mono', monospace",
            caretColor: C.t3,
            letterSpacing: 0.2,
          }}
        />
        {isSearching && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              width: 8,
              height: 8,
              border: `1.5px solid ${C.sep}`,
              borderTopColor: C.t3,
              borderRadius: "50%",
            }}
          />
        )}
      </div>
      {appliedFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={SPF}
          style={{
            marginTop: 4,
            fontSize: 8,
            color: C.t4,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {appliedFilters}
        </motion.div>
      )}
    </div>
  );
}

// ── Member Directory Preview ────────────────────────────────────────────────

type MemberDirectoryPreviewProps = {
  /** Use compact mini cards for dashboard embedding */
  compact?: boolean;
  /** Callback when member is selected (used in compact mode to handle externally) */
  onMemberSelect?: (member: MockMember) => void;
};

// Export MockMember for parent components
export type { MockMember };

export function MemberDirectoryPreview({ compact = false, onMemberSelect }: MemberDirectoryPreviewProps) {
  const C = useC();
  const { dark } = useTheme();
  const theme = useCardColors(C);

  // Compact mode (sidebar) = list only, full mode = grid default
  const [view, setView] = useState<"grid" | "list">(compact ? "list" : "grid");
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<string | null>(null);
  const [filteredMembers, setFilteredMembers] = useState(DIRECTORY_MEMBERS);
  const [selectedMember, setSelectedMember] = useState<MockMember | null>(null);

  const getMemberColor = (member: MockMember) => {
    const colorIndex = LIFECYCLE_COLOR_MAP[member.lifecycle] || 0;
    const color = theme.colors[colorIndex % theme.colors.length];
    return color;
  };

  // AI-powered search across member data and artefact content
  useEffect(() => {
    if (!query) {
      setAppliedFilters(null);
      setFilteredMembers(DIRECTORY_MEMBERS);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      const q = query.toLowerCase();

      // Parse filter keywords
      let lifecycle: "new" | "active" | "dormant" | undefined;
      let minEngagement: number | undefined;
      let searchQuery = query;

      if (q.includes("active")) {
        lifecycle = "active";
        searchQuery = q.replace("active", "").trim();
        setAppliedFilters('lifecycle: "active"');
      } else if (q.includes("dormant") || q.includes("inactive")) {
        lifecycle = "dormant";
        searchQuery = q.replace(/dormant|inactive/g, "").trim();
        setAppliedFilters('lifecycle: "dormant"');
      } else if (q.includes("new")) {
        lifecycle = "new";
        searchQuery = q.replace("new", "").trim();
        setAppliedFilters('lifecycle: "new"');
      } else if (q.includes("engaged") || q.includes("high performer")) {
        minEngagement = 70;
        searchQuery = q.replace(/engaged|high performer/g, "").trim();
        setAppliedFilters("engagement > 70%");
      }

      // Run search
      const results = await searchCommunityMembers("test", searchQuery || query, {
        lifecycle,
        minEngagement,
        limit: 20,
      });

      if (results.length > 0) {
        setFilteredMembers(results.map(r => r.member));
        if (!lifecycle && !minEngagement) {
          const matchTypes = [...new Set(results.flatMap(r => r.matchedFields))].slice(0, 3);
          setAppliedFilters(matchTypes.length > 0 ? `matched: ${matchTypes.join(", ")}` : `search: "${query}"`);
        }
      } else {
        setFilteredMembers([]);
        setAppliedFilters(`no results for "${query}"`);
      }

      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const selectedColor = selectedMember ? getMemberColor(selectedMember) : theme.colors[0];

  // Handle member click - use external handler in compact mode
  const handleMemberClick = (member: MockMember) => {
    if (compact && onMemberSelect) {
      onMemberSelect(member);
    } else {
      setSelectedMember(member);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPF}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: C.blue,
            }}
          />
          <Lbl style={{ fontSize: 8 }}>directory</Lbl>
          <span style={{ fontSize: 10, color: C.t3 }}>
            {filteredMembers.length} members
          </span>
        </div>
        {/* Hide view toggle in compact/sidebar mode */}
        {!compact && (
          <div style={{ display: "flex", gap: 3 }}>
            {(["grid", "list"] as const).map((v) => (
              <motion.button
                key={v}
                onClick={() => setView(v)}
                animate={{
                  background: view === v ? C.edge : "transparent",
                  color: view === v ? C.t1 : C.t4,
                }}
                style={{
                  padding: "4px 8px",
                  fontSize: 9,
                  fontFamily: "'DM Mono', monospace",
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                }}
              >
                {v}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <AISearchBar
        query={query}
        setQuery={setQuery}
        isSearching={isSearching}
        appliedFilters={appliedFilters}
      />

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        <AnimatePresence mode="wait">
          {view === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: compact ? 16 : 24,
                padding: compact ? 16 : 24,
                justifyContent: "flex-start",
              }}
            >
              {filteredMembers.map((member) => {
                const color = getMemberColor(member);
                const mockRooms = [
                  { id: "about", label: "About", blocks: [{ id: "1", blockType: "text" as const, orderIndex: 0 }, { id: "2", blockType: "text" as const, orderIndex: 1 }] },
                  { id: member.company.toLowerCase(), label: member.company, blocks: [{ id: "3", blockType: "text" as const, orderIndex: 0 }] },
                  { id: "pitch", label: "Pitch", blocks: [] },
                ];
                return (
                  <CompactCard
                    key={member.id}
                    identity={{
                      name: member.name,
                      title: `${member.role} at ${member.company}`,
                      bio: "",
                      location: "",
                      skills: [],
                      links: [],
                    }}
                    rooms={mockRooms}
                    accent={color.accent}
                    cardBg={color.card}
                    onExpand={() => handleMemberClick(member)}
                    onShowOutputs={() => {}}
                    colorId={color.id}
                    onColorChange={() => {}}
                    theme={theme}
                    dark={dark}
                    onToggleTheme={() => {}}
                    readOnly
                    size={compact ? "mini" : "default"}
                  />
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Column headers */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px 1fr 60px 50px 50px",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 12px",
                  background: C.edge,
                  borderBottom: `1px solid ${C.sep}`,
                }}
              >
                <div />
                <Lbl style={{ fontSize: 7 }}>member</Lbl>
                <Lbl style={{ fontSize: 7 }}>stage</Lbl>
                <Lbl style={{ fontSize: 7 }}>status</Lbl>
                <Lbl style={{ fontSize: 7 }}>score</Lbl>
              </div>
              {filteredMembers.map((member, index) => {
                const color = getMemberColor(member);
                return (
                  <MemberRow
                    key={member.id}
                    member={member}
                    index={index}
                    accent={color.accent}
                    onClick={() => handleMemberClick(member)}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {filteredMembers.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              color: C.t3,
              fontSize: 11,
            }}
          >
            No members match this search
          </div>
        )}
      </div>

      {/* Saved Segments - hide in compact mode */}
      {!compact && (
        <div
          style={{
            padding: "8px 12px",
            borderTop: `1px solid ${C.sep}`,
            background: C.edge,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["High performers", "Needs attention", "New"].map((seg) => (
              <motion.button
                key={seg}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (seg === "High performers") setQuery("engaged active");
                  else if (seg === "Needs attention") setQuery("dormant");
                  else setQuery("");
                }}
                style={{
                  padding: "3px 8px",
                  fontSize: 9,
                  border: `1px solid ${C.sep}`,
                  borderRadius: 4,
                  background: C.bg,
                  color: C.t2,
                  cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {seg}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Expanded Member Overlay - ExpandedArtefact */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `${C.void}ee`,
              backdropFilter: "blur(8px)",
            }}
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{ padding: 32 }}
            >
              <MemberArtefactProvider member={selectedMember}>
                <ExpandedArtefact
                  accent={selectedColor.accent}
                  cardBg={selectedColor.card}
                  colorId={selectedColor.id}
                  onColorChange={() => {}}
                  onCollapse={() => setSelectedMember(null)}
                  theme={theme}
                  dark={dark}
                  onToggleTheme={() => {}}
                  readOnly
                />
              </MemberArtefactProvider>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
