"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { useC } from "@/hooks/useC";
import { useHover } from "@/hooks/useHover";
import { mkST } from "@/lib/status";
import { SP, SPF, FADE } from "@/lib/motion";
import { Avatar } from "@/components/primitives/Avatar";
import { Dot } from "@/components/primitives/Dot";
import { Btn } from "@/components/primitives/Btn";
import { Lbl } from "@/components/primitives/Lbl";
import { Region } from "./Region";
import { LinkPreviewGrid } from "./LinkPreview";
import { BlockComposer } from "@/components/room/BlockComposer";
import {
  getRoomName,
  getRoomSubtitle,
  getStageMarkerName,
  formatStageMarkerProgress,
  getStatusMessage,
  formatOverallProgress,
  getRoomTypeIcon,
  // Legacy exports for backwards compat
  getSectionName,
  getSectionSubtitle,
  getCheckpointName,
} from "@/lib/labels";
import type { Member, MemberProfile, ArtefactRole } from "@/types/member";
import type { Room, RoomStatus, Block } from "@/types/room";
import type { Section } from "@/types/section";

// Support both rooms and legacy sections
type ArtefactProps = {
  member:          Member & { profile?: MemberProfile };
  rooms?:          Room[];
  sections?:       Section[];  // Legacy prop
  setRooms?:       (updater: (prev: Room[]) => Room[]) => void;
  setSections?:    (updater: (prev: Section[]) => Section[]) => void;  // Legacy
  role:            ArtefactRole;
  syncing:         boolean;
  compact:         boolean;
  onToggleCompact: () => void;
  avatarSrc?:      string | null;
  onAvatarChange?: (src: string | null) => void;
  workspaceSlot?:  React.ReactNode;
};

type DrillKey = "identity" | "rooms";

export function Artefact({
  member, rooms: roomsProp, sections: sectionsProp, setSections, role, syncing, compact,
  onToggleCompact, avatarSrc, onAvatarChange, workspaceSlot,
}: ArtefactProps) {
  const C  = useC();
  const ST = mkST(C);
  const [drilled, setDrilled] = useState<DrillKey | null>(null);
  const ph = useHover(350);

  // Support both rooms and legacy sections
  const rooms: Room[] = roomsProp ?? (sectionsProp?.map(s => ({
    id: s.id,
    key: s.id,
    label: s.label,
    roomType: "text" as const,
    stageMarker: s.cp === 1 ? "early" : "later" as const,
    status: s.status as RoomStatus,
    orderIndex: 0,
    isPublic: true,
    content: {
      type: "text" as const,
      data: {
        body: s.evidence,
        feedback: s.feedback,
        feedbackAt: s.feedbackAt,
        feedbackBy: s.feedbackBy,
        links: s.links,
      },
    },
  })) ?? []);

  // Handler for room updates - converts blocks back to sections
  const handleRoomUpdate = (roomId: string, blocks: Block[]) => {
    if (setSections) {
      setSections(prev => prev.map(s => {
        if (s.id !== roomId) return s;
        // Convert blocks to evidence string (first text block's content)
        const textBlock = blocks.find(b => b.blockType === "text");
        const evidence = textBlock?.content || "";
        const newStatus = blocks.length > 0 ? "in_progress" : "empty";
        return { ...s, evidence, status: s.status === "empty" ? newStatus : s.status };
      }));
    }
  };

  const profile = member.profile;

  // Count by stage marker (excluding ongoing from totals)
  const earlyRooms = rooms.filter(r => r.stageMarker === "early");
  const laterRooms = rooms.filter(r => r.stageMarker === "later");
  const earlyDone = earlyRooms.filter(r => r.status === "accepted").length;
  const laterDone = laterRooms.filter(r => r.status === "accepted").length;

  // ── COMPACT ─────────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <CompactCard
        member={member}
        syncing={syncing}
        avatarSrc={avatarSrc}
        onAvatarChange={onAvatarChange}
        onExpand={onToggleCompact}
      />
    );
  }

  // ── EXPANDED ────────────────────────────────────────────────────────────────
  const SZ = "min(70vw, 70vh)";

  return (
    <div style={{ position: "relative", width: SZ, height: SZ, flexShrink: 0 }}>
      {/* Floating label */}
      <div style={{ position: "absolute", top: -18, left: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <Lbl style={{ fontSize: 8 }}>input_001</Lbl>
        <span style={{ fontSize: 10, color: C.t4 }}>{member.name} — {member.title}</span>
      </div>

      <motion.div
        animate={{ borderColor: syncing ? C.blue + "44" : C.edge, background: C.void }}
        style={{
          width: "100%", height: "100%",
          border: `1px solid ${C.edge}`, borderRadius: 14,
          display: "grid", gridTemplateColumns: "1fr 1fr",
          overflow: "hidden", position: "relative",
        }}
      >
        {/* LEFT column */}
        <div style={{ display: "flex", flexDirection: "column", padding: "22px 24px", height: "100%", overflow: "hidden", borderRight: `1px solid ${C.sep}` }}>
          {/* Identity region */}
          <Region tag="identity" flex="none">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <Avatar size={40} imgSrc={avatarSrc} onImgChange={onAvatarChange || undefined}
                onClick={() => setDrilled("identity")} style={{ cursor: "pointer" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 600, color: C.t1, letterSpacing: "-.025em", marginBottom: 3, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {member.name}
                </div>
                <div style={{ fontSize: 12, color: C.t3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.4 }}>
                  {member.title}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, paddingBottom: 16 }}>
              <span style={{ fontSize: 11, color: C.t3 }}>{member.email}</span>
              <span style={{ fontSize: 11, color: C.t4 }}>{member.location}</span>
            </div>
          </Region>

          {/* Rooms region (was sections) */}
          <Region tag="rooms" onClick={() => setDrilled("rooms")} flex={1}
            syncBorder={syncing ? C.blue + "33" : C.sep}>
            {/* Stage marker progress bars */}
            <div style={{ display: "flex", gap: 14, marginBottom: 14, flexShrink: 0 }}>
              {([["early", earlyDone, earlyRooms.length], ["later", laterDone, laterRooms.length]] as const).map(([marker, done, total]) => (
                <div key={marker} style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <Lbl style={{ fontSize: 9 }}>{getStageMarkerName(marker)}</Lbl>
                    <span className="mono" style={{ fontSize: 9, color: done === total && total > 0 ? C.green : C.t3 }}>
                      {total === 0 ? "none" : done === 0 ? "not started" : done === total ? "complete" : `${done}/${total}`}
                    </span>
                  </div>
                  <div style={{ height: 1, background: C.sep }}>
                    <motion.div animate={{ width: total > 0 ? `${(done / total) * 100}%` : "0%" }} transition={SPF}
                      style={{ height: "100%", background: done === total && total > 0 ? C.green : C.blue }} />
                  </div>
                </div>
              ))}
            </div>
            {/* Room rows */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {rooms.filter(r => r.stageMarker !== "ongoing").slice(0, 4).map((r, i, arr) => {
                const showSubtitle = r.status === "empty" || r.status === "in_progress";
                const textContent = r.content?.type === "text" ? r.content.data : null;
                const hasFeedback = !!textContent?.feedback;
                return (
                  <motion.div key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={FADE}
                    style={{ display: "flex", flexDirection: "column", padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.sep}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: C.t4 }}>{getRoomTypeIcon(r.roomType)}</span>
                        <span style={{ fontSize: 13, color: C.t2, fontWeight: 400 }}>{getRoomName(r.key, r.label)}</span>
                      </div>
                      <Dot status={r.status} />
                    </div>
                    {/* Subtitle/prompt when empty/in progress */}
                    {showSubtitle && (
                      <div style={{ fontSize: 11, color: C.t4, marginTop: 3, lineHeight: 1.4, paddingLeft: 17 }}>
                        {getRoomSubtitle(r.key, r.prompt)}
                      </div>
                    )}
                    {/* Link previews (compact) */}
                    {textContent?.links && textContent.links.length > 0 && (
                      <div style={{ marginTop: 6, paddingLeft: 17 }}>
                        <LinkPreviewGrid links={textContent.links} compact maxItems={2} />
                      </div>
                    )}
                    {/* Feedback message for member */}
                    {role === "member" && (r.status === "reviewed" || r.status === "in_progress") && hasFeedback && (
                      <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.55, marginTop: 5, marginLeft: 17, padding: "6px 10px", borderLeft: `2px solid ${r.status === "reviewed" ? C.amber : C.sep}`, background: r.status === "reviewed" ? C.amber + "08" : "transparent" }}>
                        <div style={{ fontSize: 10, color: r.status === "reviewed" ? C.amber : C.t4, marginBottom: 4, fontWeight: 500 }}>
                          {getStatusMessage(r.status, hasFeedback)}
                        </div>
                        <div style={{ fontStyle: "italic" }}>
                          {textContent?.feedback}
                          {textContent?.feedbackAt && <span className="mono" style={{ fontSize: 8, color: C.t4, marginLeft: 8, fontStyle: "normal" }}>{textContent.feedbackAt}</span>}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </Region>
        </div>

        {/* RIGHT column */}
        <div style={{ display: "flex", flexDirection: "column", padding: "22px 24px", height: "100%", overflow: "hidden" }}>
          {/* Workspace/mentor slot or practice region */}
          {workspaceSlot
            ? <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{workspaceSlot}</div>
            : (
              <>
                <Region tag="practice" onClick={() => setDrilled("rooms")} flex={ph.active ? 3 : 1} {...ph}>
                  <div style={{ overflow: "auto", flex: 1 }}>
                    <p style={{ fontSize: 14, color: C.t2, lineHeight: 1.82, margin: 0, fontWeight: 400 }}>
                      {profile?.practice || ""}
                    </p>
                    <AnimatePresence>
                      {ph.active && (
                        <motion.div key="f" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }} transition={SPF} style={{ overflow: "hidden" }}>
                          <div style={{ height: 1, background: C.sep, margin: "13px 0" }} />
                          <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.75, margin: 0 }}>{profile?.focus || ""}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Region>
                <Region tag="connect" onClick={() => setDrilled("identity")} flex={ph.active ? 1 : 2}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ fontSize: 14, color: C.t2, fontWeight: 400 }}>{member.email}</div>
                    <div style={{ fontSize: 14, color: C.t2, fontWeight: 400 }}>{member.phone}</div>
                    <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{profile?.availability || ""}</div>
                  </div>
                </Region>
              </>
            )
          }
        </div>

        {/* Drill overlay */}
        <AnimatePresence>
          {drilled && (
            <DrillOverlay
              key={drilled}
              drillKey={drilled}
              member={member}
              rooms={rooms}
              onRoomUpdate={handleRoomUpdate}
              role={role}
              avatarSrc={avatarSrc}
              onAvatarChange={onAvatarChange}
              onBack={() => setDrilled(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── Compact card ─────────────────────────────────────────────────────────────

type CompactCardProps = {
  member:          Member & { profile?: MemberProfile };
  syncing:         boolean;
  avatarSrc?:      string | null;
  onAvatarChange?: (src: string | null) => void;
  onExpand:        () => void;
};

function CompactCard({ member, syncing, avatarSrc, onAvatarChange, onExpand }: CompactCardProps) {
  const C = useC();
  const [showQR, setShowQR] = useState(false);

  const vcard = [
    "BEGIN:VCARD", "VERSION:3.0",
    `FN:${member.name}`,
    `TITLE:${member.title}`,
    `EMAIL:${member.email}`,
    member.phone ? `TEL:${member.phone}` : "",
    `ADR:${member.location}`,
    "END:VCARD",
  ].filter(Boolean).join("\n");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1, borderColor: syncing ? C.blue + "44" : C.edge, background: C.void }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={SP}
      style={{ border: `1px solid ${C.edge}`, borderRadius: 14, overflow: "hidden", width: 300, flexShrink: 0 }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px 10px", borderBottom: `1px solid ${C.sep}` }}>
        <Lbl style={{ fontSize: 8 }}>input_001</Lbl>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Btn onClick={() => setShowQR(v => !v)} accent={showQR ? C.blue : undefined} style={{ fontSize: 9 }}>{"\u229E"} qr</Btn>
          <Btn onClick={onExpand} style={{ fontSize: 9 }}>{"\u229E"} expand</Btn>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showQR ? (
          <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
            style={{ padding: "24px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <QRDisplay value={vcard} size={148} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.t1, letterSpacing: "-.015em" }}>{member.name}</div>
              <div style={{ fontSize: 10, color: C.t3, fontFamily: "'DM Mono', monospace" }}>scan to save contact</div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="id" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
            style={{ padding: "20px 22px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <Avatar size={44} imgSrc={avatarSrc} onImgChange={onAvatarChange || undefined} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: C.t1, letterSpacing: "-.025em", marginBottom: 3, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {member.name}
                </div>
                <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {member.title}
                </div>
              </div>
            </div>
            <div style={{ height: 1, background: C.sep, marginBottom: 14 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 12, color: C.t2 }}>{member.email}</div>
              <div style={{ fontSize: 12, color: C.t3 }}>{member.phone}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 2 }}>
                <span style={{ fontSize: 11, color: C.t4 }}>{member.location}</span>
                <span style={{ fontSize: 10, color: member.accepted === member.sections ? C.green : C.t3, fontFamily: "'DM Mono', monospace" }}>
                  {formatOverallProgress(member.accepted, member.sections)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── QR display (lazy-loads qrcodejs) ─────────────────────────────────────────

function QRDisplay({ value, size }: { value: string; size: number }) {
  const C = useC();
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setDataUrl)
      .catch(console.error);
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center",
        background: C.sep, borderRadius: 8, color: C.t4, fontSize: 9, fontFamily: "monospace" }}>
        Loading...
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      style={{ width: size, height: size, borderRadius: 8 }}
    />
  );
}

// ── Drill overlay ─────────────────────────────────────────────────────────────

type DrillOverlayProps = {
  drillKey:        DrillKey;
  member:          Member & { profile?: MemberProfile };
  rooms:           Room[];
  onRoomUpdate?:   (roomId: string, blocks: Block[]) => void;
  avatarSrc?:      string | null;
  onAvatarChange?: (src: string | null) => void;
  onBack:          () => void;
  role?:           ArtefactRole;
};

function DrillOverlay({ drillKey, member, rooms, onRoomUpdate, avatarSrc, onAvatarChange, onBack, role = "member" }: DrillOverlayProps) {
  const C       = useC();
  const profile = member.profile;
  const [aL, setAL] = useState(0);
  const [aR, setAR] = useState(0);
  const [fsRoom, setFsRoom] = useState<Room | null>(null);

  // Identity drill uses fixed quads
  if (drillKey === "identity") {
    const quads = [
      { tag: "profile",  content: <ProfileQuad member={member} avatarSrc={avatarSrc} onAvatarChange={onAvatarChange} /> },
      { tag: "social",   content: <SocialQuad profile={profile} /> },
      { tag: "goals",    content: <GoalsQuad profile={profile} /> },
      { tag: "focus",    content: <FocusQuad profile={profile} /> },
    ];
    const L = [quads[0], quads[2]];
    const R = [quads[1], quads[3]];

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
        style={{ position: "absolute", inset: 0, background: C.void, border: `1px solid ${C.edge}`, borderRadius: 14, display: "flex", flexDirection: "column", zIndex: 10, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px 10px", borderBottom: `1px solid ${C.sep}`, flexShrink: 0 }}>
          <Btn onClick={onBack}>{"\u2190"} back</Btn>
          <div style={{ width: 1, background: C.sep, alignSelf: "stretch" }} />
          <Lbl style={{ color: C.t2 }}>{drillKey}</Lbl>
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
          {[{ items: L, a: aL, setA: setAL }, { items: R, a: aR, setA: setAR }].map(({ items, a, setA }, ci) => (
            <div key={ci} style={{ display: "flex", flexDirection: "column", padding: "14px 18px", height: "100%", overflow: "hidden", borderRight: ci === 0 ? `1px solid ${C.sep}` : "none" }}>
              {items.map((q, i) => (
                <motion.div key={i} layout transition={SP} style={{ flex: a === i ? 3 : 1, minHeight: 0, display: "flex", flexDirection: "column", cursor: "pointer" }} onClick={() => setA(i)}>
                  <div style={{ borderTop: `1px solid ${C.sep}`, paddingTop: 11, flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <Lbl style={{ marginBottom: 8, display: "block", flexShrink: 0 }}>{q.tag}</Lbl>
                    <AnimatePresence mode="wait">
                      {a === i
                        ? <motion.div key="o" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.11 }} style={{ overflow: "auto", height: "100%" }}>{q.content}</motion.div>
                        : <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} exit={{ opacity: 0 }} style={{ fontSize: 10, color: C.t3 }}>{q.tag}</motion.div>
                      }
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Rooms drill: rooms become the quads directly
  // Left column: rooms[0], rooms[2]. Right column: rooms[1], rooms[3]
  const r = rooms.slice(0, 4);
  const leftRooms  = [r[0], r[2]].filter(Boolean);
  const rightRooms = [r[1], r[3]].filter(Boolean);

  return (
    <>
      {/* Fullscreen room overlay */}
      <AnimatePresence>
        {fsRoom && (
          <motion.div
            key="fs-room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
            style={{
              position: "fixed",
              inset: 0,
              background: C.void,
              zIndex: 300,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <RoomFullscreen
              room={fsRoom}
              onUpdate={onRoomUpdate}
              onClose={() => setFsRoom(null)}
              role={role}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
        style={{ position: "absolute", inset: 0, background: C.void, border: `1px solid ${C.edge}`, borderRadius: 14, display: "flex", flexDirection: "column", zIndex: 10, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px 10px", borderBottom: `1px solid ${C.sep}`, flexShrink: 0 }}>
          <Btn onClick={onBack}>{"\u2190"} back</Btn>
          <div style={{ width: 1, background: C.sep, alignSelf: "stretch" }} />
          <Lbl style={{ color: C.t2 }}>rooms</Lbl>
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", padding: "14px 18px", height: "100%", overflow: "hidden", borderRight: `1px solid ${C.sep}` }}>
            {leftRooms.map((room, i) => (
              <RoomPanel
                key={room.id}
                room={room}
                isActive={aL === i}
                onActivate={() => setAL(i)}
                onUpdate={onRoomUpdate}
                onFullscreen={() => setFsRoom(room)}
                role={role}
              />
            ))}
          </div>
          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", padding: "14px 18px", height: "100%", overflow: "hidden" }}>
            {rightRooms.map((room, i) => (
              <RoomPanel
                key={room.id}
                room={room}
                isActive={aR === i}
                onActivate={() => setAR(i)}
                onUpdate={onRoomUpdate}
                onFullscreen={() => setFsRoom(room)}
                role={role}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Drill quad content components

function ProfileQuad({ member, avatarSrc, onAvatarChange }: { member: Member & { profile?: MemberProfile }; avatarSrc?: string | null; onAvatarChange?: (src: string | null) => void }) {
  const C = useC();
  return (
    <div>
      <div style={{ marginBottom: 14 }}><Avatar size={42} imgSrc={avatarSrc} onImgChange={onAvatarChange || undefined} /></div>
      <div style={{ fontSize: 20, fontWeight: 600, color: C.t1, marginBottom: 4, letterSpacing: "-.025em", lineHeight: 1.2 }}>{member.name}</div>
      <div style={{ fontSize: 13, color: C.t2, marginBottom: 14, lineHeight: 1.4 }}>{member.title}</div>
      <div style={{ height: 1, background: C.sep, marginBottom: 14 }} />
      {[member.email, member.phone, member.location].map((v, i) => v && <div key={i} style={{ fontSize: 13, color: C.t2, marginBottom: 7, lineHeight: 1.5 }}>{v}</div>)}
    </div>
  );
}

function SocialQuad({ profile }: { profile?: MemberProfile }) {
  const C = useC();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {["instagram", "twitter", "linkedin"].map(s => <div key={s} style={{ fontSize: 14, color: C.t2, padding: "10px 0", borderBottom: `1px solid ${C.sep}`, fontWeight: 400 }}>{s}</div>)}
      <div style={{ fontSize: 13, color: C.t3, lineHeight: 1.65, marginTop: 12 }}>{profile?.availability || ""}</div>
    </div>
  );
}

function GoalsQuad({ profile }: { profile?: MemberProfile }) {
  const C = useC();
  const goals = profile?.goals || [];
  return (
    <div>
      {goals.map((g, i, a) => <div key={i} style={{ fontSize: 13, color: C.t2, lineHeight: 1.65, padding: "10px 0", borderBottom: i < a.length - 1 ? `1px solid ${C.sep}` : "none" }}>{g}</div>)}
    </div>
  );
}

function FocusQuad({ profile }: { profile?: MemberProfile }) {
  const C = useC();
  return <div style={{ fontSize: 14, color: C.t2, lineHeight: 1.82, fontWeight: 400 }}>{profile?.focus || ""}</div>;
}

// RoomPanel: one room = one quad. Collapsed shows preview, expanded shows BlockComposer.
type RoomPanelProps = {
  room: Room;
  isActive: boolean;
  onActivate: () => void;
  onUpdate?: (roomId: string, blocks: Block[]) => void;
  onFullscreen?: () => void;
  role: ArtefactRole;
};

function RoomPanel({ room, isActive, onActivate, onUpdate, onFullscreen, role }: RoomPanelProps) {
  const C = useC();
  const textContent = room.content?.type === "text" ? room.content.data : null;

  // Convert existing content to blocks
  const blocks: Block[] = textContent?.body
    ? [{ id: `block_${room.id}`, blockType: "text" as const, content: textContent.body, orderIndex: 0 }]
    : [];

  const isEmpty = blocks.length === 0;
  const isEditable = role === "member" && room.status !== "accepted";

  // First block preview text
  const previewText = blocks[0]?.content?.replace(/<[^>]+>/g, "").slice(0, 60) || "";

  return (
    <motion.div
      layout
      transition={SP}
      onClick={!isActive ? onActivate : undefined}
      style={{
        flex: isActive ? 4 : 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        cursor: isActive ? "default" : "pointer",
        borderTop: `1px solid ${C.sep}`,
        paddingTop: 11,
        overflow: "hidden",
      }}
    >
      {/* Header: label + status + fullscreen */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexShrink: 0 }}>
        <Lbl>{room.label}</Lbl>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isActive && onFullscreen && (
            <Btn onClick={() => onFullscreen()} style={{ fontSize: 9, padding: "2px 6px" }}>
              ⊡
            </Btn>
          )}
          <Dot status={room.status} hideLabel={!isActive} size={isActive ? 6 : 5} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isActive ? (
          // Expanded: full block list + composer
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.11 }}
            style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}
          >
            {/* Purpose as invitation when empty */}
            {isEmpty && room.prompt && (
              <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.65, margin: "0 0 16px", fontStyle: "italic" }}>
                {room.prompt}
              </p>
            )}

            {/* BlockComposer */}
            <div style={{ flex: 1 }}>
              <BlockComposer
                blocks={blocks}
                onChange={(newBlocks) => onUpdate?.(room.id, newBlocks)}
                readOnly={!isEditable}
              />
            </div>

            {/* Mentor feedback */}
            {textContent?.feedback && (
              <div style={{
                marginTop: 12,
                padding: 10,
                background: room.status === "reviewed" ? C.amber + "10" : C.green + "10",
                borderLeft: `2px solid ${room.status === "reviewed" ? C.amber : C.green}`,
                borderRadius: 4,
              }}>
                <div style={{ fontSize: 10, color: room.status === "reviewed" ? C.amber : C.green, marginBottom: 4, fontWeight: 500 }}>
                  {room.status === "reviewed" ? "Needs revision" : "Approved"}
                </div>
                <div style={{ fontSize: 12, color: C.t2, lineHeight: 1.5, fontStyle: "italic" }}>
                  {textContent.feedback}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          // Collapsed: preview
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            style={{ fontSize: 11, color: C.t4, lineHeight: 1.4 }}
          >
            {previewText || (room.prompt ? room.prompt.slice(0, 40) + "..." : "click to add")}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// RoomFullscreen: full-page room view
type RoomFullscreenProps = {
  room: Room;
  onUpdate?: (roomId: string, blocks: Block[]) => void;
  onClose: () => void;
  role: ArtefactRole;
};

function RoomFullscreen({ room, onUpdate, onClose, role }: RoomFullscreenProps) {
  const C = useC();
  const textContent = room.content?.type === "text" ? room.content.data : null;

  // Convert existing content to blocks
  const blocks: Block[] = textContent?.body
    ? [{ id: `block_${room.id}`, blockType: "text" as const, content: textContent.body, orderIndex: 0 }]
    : [];

  const isEmpty = blocks.length === 0;
  const isEditable = role === "member" && room.status !== "accepted";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 24px",
        borderBottom: `1px solid ${C.sep}`,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Btn onClick={onClose}>{"\u2190"} back</Btn>
          <div style={{ width: 1, height: 16, background: C.sep }} />
          <Lbl style={{ color: C.t2 }}>{room.label}</Lbl>
        </div>
        <Dot status={room.status} />
      </div>

      {/* Content area */}
      <div style={{
        flex: 1,
        overflow: "auto",
        padding: "32px 24px",
        display: "flex",
        justifyContent: "center",
      }}>
        <div style={{ width: "100%", maxWidth: 680 }}>
          {/* Purpose as invitation when empty */}
          {isEmpty && room.prompt && (
            <p style={{
              fontSize: 15,
              color: C.t3,
              lineHeight: 1.7,
              margin: "0 0 24px",
              fontStyle: "italic",
            }}>
              {room.prompt}
            </p>
          )}

          {/* BlockComposer */}
          <BlockComposer
            blocks={blocks}
            onChange={(newBlocks) => onUpdate?.(room.id, newBlocks)}
            readOnly={!isEditable}
          />

          {/* Mentor feedback */}
          {textContent?.feedback && (
            <div style={{
              marginTop: 24,
              padding: 16,
              background: room.status === "reviewed" ? C.amber + "10" : C.green + "10",
              borderLeft: `3px solid ${room.status === "reviewed" ? C.amber : C.green}`,
              borderRadius: 6,
            }}>
              <div style={{
                fontSize: 11,
                color: room.status === "reviewed" ? C.amber : C.green,
                marginBottom: 6,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: ".05em",
              }}>
                {room.status === "reviewed" ? "Needs revision" : "Approved"}
              </div>
              <div style={{ fontSize: 14, color: C.t2, lineHeight: 1.6, fontStyle: "italic" }}>
                {textContent.feedback}
              </div>
              {textContent.feedbackAt && (
                <div className="mono" style={{ fontSize: 10, color: C.t4, marginTop: 8 }}>
                  {textContent.feedbackAt}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WorksQuad({ profile }: { profile?: MemberProfile }) {
  const C = useC();
  const projects = profile?.projects || [];
  return (
    <div>
      {projects.map((p, pi) => (
        <div key={pi} style={{ marginBottom: 16 }}>
          <span className="mono" style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: ".07em", display: "block", marginBottom: 8 }}>{p.name}</span>
          {p.works.map((w, wi, a) => (
            <div key={wi} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0", borderBottom: wi < a.length - 1 ? `1px solid ${C.sep}` : "none" }}>
              <span style={{ fontSize: 13, color: C.t2, fontWeight: 400 }}>{w.title}</span>
              <span className="mono" style={{ fontSize: 10, color: C.t3 }}>{w.year}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SkillsQuad({ profile }: { profile?: MemberProfile }) {
  const C = useC();
  const skills = profile?.skills || { Primary: [], Tools: [], Mediums: [] };
  return (
    <div>
      {(Object.entries(skills) as [string, string[]][]).map(([cat, items]) => (
        <div key={cat} style={{ marginBottom: 16 }}>
          <span className="mono" style={{ fontSize: 10, color: C.t3, textTransform: "uppercase", letterSpacing: ".07em", display: "block", marginBottom: 9 }}>{cat}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {items.map(item => <span key={item} style={{ fontSize: 13, color: C.t2, fontWeight: 400 }}>{item}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}
