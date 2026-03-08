"use client";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { Artefact } from "@/components/artefact/Artefact";
import { Lbl } from "@/components/primitives/Lbl";
import type { Member, MemberProfile } from "@/types/member";
import type { Section } from "@/types/section";

type PendingWaitingRoomProps = {
  member: Member & { profile?: MemberProfile };
  sections: Section[];
  communityName: string;
};

export function PendingWaitingRoom({ member, sections, communityName }: PendingWaitingRoomProps) {
  const C = useC();

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, gap: 32, minHeight: "100vh",
    }}>
      {/* Status banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: C.amber + "15", border: `1px solid ${C.amber}33`,
          borderRadius: 12, padding: "16px 24px", maxWidth: 400, textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 8, height: 8, borderRadius: "50%", background: C.amber,
              boxShadow: `0 0 8px ${C.amber}`,
            }}
          />
          <Lbl style={{ color: C.amber }}>application under review</Lbl>
        </div>
        <p style={{ fontSize: 13, color: C.t2, lineHeight: 1.6, margin: 0 }}>
          Your artefact has been created and your application is being reviewed by {communityName}.
          You'll receive an email when a decision is made.
        </p>
      </motion.div>

      {/* Read-only artefact preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ position: "relative" }}
      >
        {/* Overlay to prevent interaction */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          background: "transparent", cursor: "default",
        }} />

        {/* Dimmed artefact */}
        <div style={{ opacity: 0.7, pointerEvents: "none" }}>
          <Artefact
            member={member}
            sections={sections}
            role="member"
            syncing={false}
            compact={false}
            onToggleCompact={() => {}}
          />
        </div>
      </motion.div>

      {/* Info text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{ textAlign: "center", maxWidth: 320 }}
      >
        <p style={{ fontSize: 12, color: C.t4, lineHeight: 1.6, margin: 0 }}>
          This is a preview of your artefact. Once accepted, you'll be able to
          edit your workspace and submit sections for review.
        </p>
      </motion.div>
    </div>
  );
}
