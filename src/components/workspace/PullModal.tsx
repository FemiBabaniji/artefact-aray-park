"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE } from "@/lib/motion";
import { Btn } from "@/components/primitives/Btn";
import { Dot } from "@/components/primitives/Dot";
import { getSectionName, getSectionSubtitle } from "@/lib/labels";
import type { Section, SectionKey } from "@/types/section";

type PullModalProps = {
  sections:   Section[];
  suggested:  Section | null;
  evidence?:  string;  // The extracted text being sent
  onConfirm:  (sid: SectionKey) => void;
  onDismiss:  () => void;
};

export function PullModal({ sections, suggested, evidence, onConfirm, onDismiss }: PullModalProps) {
  const C     = useC();
  const avail = sections.filter(s => s.status !== "accepted");
  const [sel, setSel] = useState<SectionKey>(
    suggested?.id || avail.find(s => s.status !== "accepted")?.id || sections[0].id
  );
  const [showOther, setShowOther] = useState(false);

  const selectedSection = sections.find(s => s.id === sel);
  const selectedName = getSectionName(sel);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
      style={{ position: "absolute", inset: 0, background: C.void + "ee", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, backdropFilter: "blur(6px)" }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={FADE}
        style={{ background: C.void, border: `1px solid ${C.edge}`, borderRadius: 12, padding: "22px 24px", width: 340, maxWidth: "90vw" }}>

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.t1, marginBottom: 4, letterSpacing: "-.01em" }}>
            Send for feedback: <span style={{ color: C.green }}>{selectedName}</span>
          </div>
          {selectedSection && (
            <div style={{ fontSize: 10, color: C.t4, lineHeight: 1.4 }}>
              {getSectionSubtitle(sel)}
            </div>
          )}
        </div>

        {/* Evidence preview */}
        {evidence && (
          <div style={{
            marginBottom: 16,
            padding: "12px 14px",
            background: C.sep + "22",
            borderRadius: 8,
            borderLeft: `3px solid ${C.blue}`,
          }}>
            <div style={{
              fontSize: 12,
              color: C.t2,
              lineHeight: 1.6,
              fontStyle: "italic",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}>
              "{evidence}"
            </div>
          </div>
        )}

        {/* Section selector (collapsed by default) */}
        {showOther && (
          <div style={{ marginBottom: 16, borderTop: `1px solid ${C.sep}`, paddingTop: 12 }}>
            <div style={{ fontSize: 10, color: C.t4, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Choose a different section
            </div>
            {avail.map((s, i) => (
              <motion.button key={s.id} onClick={() => { setSel(s.id); setShowOther(false); }} whileHover={{ opacity: 0.75 }}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < avail.length - 1 ? `1px solid ${C.sep}` : "none", background: "transparent", border: "none", cursor: "pointer" }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12, color: sel === s.id ? C.t1 : C.t2, fontWeight: sel === s.id ? 500 : 400 }}>
                    {getSectionName(s.id)}
                  </div>
                  <div style={{ fontSize: 10, color: C.t4, marginTop: 2 }}>
                    {getSectionSubtitle(s.id)}
                  </div>
                </div>
                <Dot status={s.status} />
              </motion.button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Btn onClick={() => setShowOther(!showOther)} style={{ fontSize: 10, color: C.t3 }}>
            {showOther ? "← back" : "Send to a different section"}
          </Btn>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={onDismiss}>cancel</Btn>
            <Btn onClick={() => onConfirm(sel)} accent={C.green}>Send this</Btn>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
