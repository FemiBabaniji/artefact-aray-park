"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE, SPF } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";
import { Dot } from "@/components/primitives/Dot";
import { getRoomName, getRoomTypeIcon } from "@/lib/labels";
import type { Room, RoomStatus } from "@/types/room";
import type { Section } from "@/types/section";

const MENTOR_ACTIONS: { status: RoomStatus; label: string; color: string }[] = [
  { status: "reviewed",    label: "leave feedback",  color: "#d97706" },
  { status: "accepted",    label: "mark complete",   color: "#16a34a" },
  { status: "in_progress", label: "request changes", color: "#f59e0b" },
];

// Support both rooms and legacy sections
type MentorPanelProps = {
  rooms?:      Room[];
  setRooms?:   (updater: (prev: Room[]) => Room[]) => void;
  sections?:   Section[];
  setSections?: (updater: (prev: Section[]) => Section[]) => void;
};

export function MentorPanel({ rooms: roomsProp, setRooms, sections: sectionsProp, setSections }: MentorPanelProps) {
  const C = useC();
  const [active, setActive] = useState<string | null>(null);
  const [draft,  setDraft]  = useState("");
  const [saving, setSaving] = useState(false);

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

  // Filter for submittable rooms (text, gallery, works)
  const submittableRooms = rooms.filter(r =>
    r.roomType === "text" || r.roomType === "gallery" || r.roomType === "works"
  );

  // Ongoing rooms (moodboard, embed) for reference section
  const ongoingRooms = rooms.filter(r =>
    r.stageMarker === "ongoing" || r.roomType === "moodboard" || r.roomType === "embed"
  );

  const queue = submittableRooms.filter(r => r.status === "submitted");
  const done  = submittableRooms.filter(r => ["reviewed", "accepted"].includes(r.status));
  const activeRoom = rooms.find(r => r.id === active);

  const openRoom = (id: string) => {
    const room = rooms.find(r => r.id === id);
    const textContent = room?.content?.type === "text" ? room.content.data : null;
    setActive(id);
    setDraft(textContent?.feedback || "");
  };

  const save = (newStatus: RoomStatus) => {
    if (!active) return;
    setSaving(true);
    setTimeout(() => {
      if (setRooms) {
        setRooms(prev => prev.map(r => r.id === active
          ? {
              ...r,
              status: newStatus,
              content: r.content?.type === "text" ? {
                ...r.content,
                data: {
                  ...r.content.data,
                  feedback: draft.trim(),
                  feedbackAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                },
              } : r.content,
            }
          : r
        ));
      } else if (setSections) {
        // Legacy: update sections
        setSections(prev => prev.map(s => s.id === active
          ? { ...s, status: newStatus as Section["status"], feedback: draft.trim(), feedbackAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) }
          : s
        ));
      }
      setSaving(false);
      setActive(null);
      setDraft("");
    }, 600);
  };

  const getTextContent = (room: Room) => {
    return room.content?.type === "text" ? room.content.data : null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 18px 11px", borderBottom: `1px solid ${C.sep}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Lbl>review queue</Lbl>
        <span className="mono" style={{ fontSize: 9, color: queue.length ? C.amber : C.t4 }}>
          {queue.length} pending
        </span>
      </div>

      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {/* Empty state */}
        {queue.length === 0 && !active && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, opacity: 0.4 }}>
            <div style={{ fontSize: 22 }}>{"\u2713"}</div>
            <Lbl style={{ color: C.t4 }}>nothing pending</Lbl>
          </div>
        )}

        {/* Queue */}
        {queue.length > 0 && (
          <div style={{ padding: "14px 18px 8px", flexShrink: 0 }}>
            {queue.map((r, i) => {
              const textContent = getTextContent(r);
              return (
                <motion.div key={r.id} layout onClick={() => openRoom(r.id)} whileHover={{ opacity: 0.85 }}
                  style={{ padding: "10px 0", borderBottom: i < queue.length - 1 ? `1px solid ${C.sep}` : "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: C.t4 }}>{getRoomTypeIcon(r.roomType)}</span>
                      <span style={{ fontSize: 13, color: active === r.id ? C.t1 : C.t2, fontWeight: active === r.id ? 500 : 400 }}>{getRoomName(r.key, r.label)}</span>
                    </div>
                    <Dot status={r.status} />
                  </div>
                  {textContent?.body && (
                    <div style={{ fontSize: 11, color: C.t4, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", paddingLeft: 17 }}>
                      {textContent.body}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Inline review editor */}
        <AnimatePresence>
          {active && activeRoom && (
            <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={FADE}
              style={{ margin: "0 18px 16px", borderTop: `1px solid ${C.sep}`, paddingTop: 14, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: C.t4 }}>{getRoomTypeIcon(activeRoom.roomType)}</span>
                <Lbl>{getRoomName(activeRoom.key, activeRoom.label)}</Lbl>
              </div>

              {/* Member's submitted content */}
              {getTextContent(activeRoom)?.body && (
                <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.6, marginBottom: 14, padding: "10px 12px", background: C.sep + "33", borderRadius: 6 }}>
                  {getTextContent(activeRoom)?.body}
                </div>
              )}

              {/* Feedback textarea */}
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Leave feedback..."
                style={{
                  width: "100%", minHeight: 80, resize: "none",
                  background: "transparent", border: `1px solid ${C.sep}`, borderRadius: 6,
                  padding: "10px 12px", color: C.t2, fontSize: 12, lineHeight: 1.6,
                  fontFamily: "'DM Sans', sans-serif", outline: "none", marginBottom: 12,
                }}
              />

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {MENTOR_ACTIONS.map(a => (
                  <motion.button key={a.status} onClick={() => save(a.status)}
                    whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.97 }}
                    style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${a.color}44`, background: "transparent", color: a.color, fontSize: 10, fontFamily: "'DM Mono',monospace", letterSpacing: ".03em", cursor: "pointer" }}>
                    {saving ? "..." : a.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ongoing rooms (reference section - no approval needed) */}
        {ongoingRooms.length > 0 && (
          <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.sep}`, flexShrink: 0 }}>
            <Lbl style={{ display: "block", marginBottom: 10 }}>reference</Lbl>
            {ongoingRooms.slice(0, 3).map((r, i) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < Math.min(ongoingRooms.length, 3) - 1 ? `1px solid ${C.sep}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: C.t4 }}>{getRoomTypeIcon(r.roomType)}</span>
                  <span style={{ fontSize: 12, color: C.t3 }}>{getRoomName(r.key, r.label)}</span>
                </div>
                <Dot status={r.status} />
              </div>
            ))}
          </div>
        )}

        {/* Done sections */}
        {done.length > 0 && (
          <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.sep}`, marginTop: ongoingRooms.length > 0 ? 0 : "auto", flexShrink: 0 }}>
            <Lbl style={{ display: "block", marginBottom: 10 }}>reviewed</Lbl>
            {done.map((r, i) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < done.length - 1 ? `1px solid ${C.sep}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: C.t4 }}>{getRoomTypeIcon(r.roomType)}</span>
                  <span style={{ fontSize: 12, color: C.t3 }}>{getRoomName(r.key, r.label)}</span>
                </div>
                <Dot status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
