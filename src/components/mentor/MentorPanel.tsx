"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE, SPF } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";
import { Dot } from "@/components/primitives/Dot";
import { getSectionName } from "@/lib/labels";
import type { Section, SectionStatus } from "@/types/section";

const MENTOR_ACTIONS: { status: SectionStatus; label: string; color: string }[] = [
  { status: "reviewed",    label: "leave feedback",  color: "#d97706" },
  { status: "accepted",    label: "mark complete",   color: "#16a34a" },
  { status: "in_progress", label: "request changes", color: "#f59e0b" },
];

type MentorPanelProps = {
  sections:    Section[];
  setSections: (updater: (prev: Section[]) => Section[]) => void;
};

export function MentorPanel({ sections, setSections }: MentorPanelProps) {
  const C = useC();
  const [active, setActive] = useState<string | null>(null);
  const [draft,  setDraft]  = useState("");
  const [saving, setSaving] = useState(false);

  const queue = sections.filter(s => s.status === "submitted");
  const done  = sections.filter(s => ["reviewed", "accepted"].includes(s.status));
  const activeSection = sections.find(s => s.id === active);

  const openSection = (id: string) => {
    setActive(id);
    setDraft(sections.find(s => s.id === id)?.feedback || "");
  };

  const save = (newStatus: SectionStatus) => {
    if (!active) return;
    setSaving(true);
    setTimeout(() => {
      setSections(prev => prev.map(s => s.id === active
        ? { ...s, status: newStatus, feedback: draft.trim(), feedbackAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) }
        : s
      ));
      setSaving(false);
      setActive(null);
      setDraft("");
    }, 600);
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
            <div style={{ fontSize: 22 }}>✓</div>
            <Lbl style={{ color: C.t4 }}>nothing pending</Lbl>
          </div>
        )}

        {/* Queue */}
        {queue.length > 0 && (
          <div style={{ padding: "14px 18px 8px", flexShrink: 0 }}>
            {queue.map((s, i) => (
              <motion.div key={s.id} layout onClick={() => openSection(s.id)} whileHover={{ opacity: 0.85 }}
                style={{ padding: "10px 0", borderBottom: i < queue.length - 1 ? `1px solid ${C.sep}` : "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: active === s.id ? C.t1 : C.t2, fontWeight: active === s.id ? 500 : 400 }}>{getSectionName(s.id)}</span>
                  <Dot status={s.status} />
                </div>
                {s.evidence && (
                  <div style={{ fontSize: 11, color: C.t4, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {s.evidence}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Inline review editor */}
        <AnimatePresence>
          {active && activeSection && (
            <motion.div key={active} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={FADE}
              style={{ margin: "0 18px 16px", borderTop: `1px solid ${C.sep}`, paddingTop: 14, flexShrink: 0 }}>
              <Lbl style={{ display: "block", marginBottom: 8 }}>{getSectionName(activeSection.id)}</Lbl>

              {/* Member's submitted evidence */}
              {activeSection.evidence && (
                <div style={{ fontSize: 12, color: C.t3, lineHeight: 1.6, marginBottom: 14, padding: "10px 12px", background: C.sep + "33", borderRadius: 6 }}>
                  {activeSection.evidence}
                </div>
              )}

              {/* Feedback textarea */}
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Leave feedback…"
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
                    {saving ? "…" : a.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Done sections */}
        {done.length > 0 && (
          <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.sep}`, marginTop: "auto", flexShrink: 0 }}>
            <Lbl style={{ display: "block", marginBottom: 10 }}>reviewed</Lbl>
            {done.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < done.length - 1 ? `1px solid ${C.sep}` : "none" }}>
                <span style={{ fontSize: 12, color: C.t3 }}>{getSectionName(s.id)}</span>
                <Dot status={s.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
