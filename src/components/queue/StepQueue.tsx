"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { mkST } from "@/lib/status";
import { FADE, SPF } from "@/lib/motion";
import { Artefact } from "@/components/artefact/Artefact";
import { Avatar } from "@/components/primitives/Avatar";
import { Lbl } from "@/components/primitives/Lbl";
import type { Member, MemberProfile } from "@/types/member";
import type { Section } from "@/types/section";

type QueueStatus = "pending" | "reviewed" | "accepted" | "declined";

type Applicant = {
  id:       string;
  member:   Member & { profile?: MemberProfile };
  sections: Section[];
  date:     string;
};

type StepQueueProps = {
  applicants: Applicant[];
};

export function StepQueue({ applicants }: StepQueueProps) {
  const C = useC();
  const [selected, setSelected] = useState<string>(applicants[0]?.id ?? "");

  // Initialize statuses based on member stage
  const [statuses] = useState<Record<string, QueueStatus>>(() => {
    const init: Record<string, QueueStatus> = {};
    applicants.forEach(a => {
      init[a.id] = a.member.stage === "pending" ? "pending"
        : a.member.accepted === a.member.sections ? "accepted"
        : "reviewed";
    });
    return init;
  });

  const sel     = applicants.find(a => a.id === selected);
  const pending = applicants.filter(a => statuses[a.id] === "pending").length;

  return (
    <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>

      {/* Left: Queue list */}
      <div style={{
        width: 280, flexShrink: 0, borderRight: `1px solid ${C.sep}`,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 20px 12px", borderBottom: `1px solid ${C.sep}`, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Lbl>review queue</Lbl>
          <span className="mono" style={{ fontSize: 9, color: pending > 0 ? C.amber : C.t4 }}>
            {pending} pending
          </span>
        </div>

        {/* Cards */}
        <div style={{ flex: 1, overflow: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {applicants.map((a, i) => (
            <ApplicantCard
              key={a.id}
              applicant={a}
              index={i}
              selected={selected === a.id}
              status={statuses[a.id]}
              onSelect={() => setSelected(a.id)}
            />
          ))}
        </div>
      </div>

      {/* Right: Artefact preview */}
      <AnimatePresence mode="wait">
        {sel && (
          <motion.div
            key={sel.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={FADE}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "auto", padding: "32px 24px 120px",
            }}
          >
            <div style={{ pointerEvents: "none", userSelect: "none" }}>
              <Artefact
                member={sel.member}
                sections={sel.sections}
                role="admin"
                syncing={false}
                compact={false}
                onToggleCompact={() => {}}
                avatarSrc={sel.member.avatarUrl}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Applicant Card ─────────────────────────────────────────────────────────

type ApplicantCardProps = {
  applicant: Applicant;
  index:     number;
  selected:  boolean;
  status:    QueueStatus;
  onSelect:  () => void;
};

function ApplicantCard({ applicant, index, selected, status, onSelect }: ApplicantCardProps) {
  const C  = useC();
  const ST = mkST(C);

  const { member, sections, date } = applicant;
  const done = sections.filter(s => s.status === "accepted").length;

  const statusColor = {
    accepted: C.green,
    reviewed: C.amber,
    declined: "#ef4444",
    pending:  C.t4,
  }[status];

  return (
    <motion.div
      onClick={onSelect}
      whileHover={{ opacity: 0.9 }}
      whileTap={{ scale: 0.98 }}
      animate={{ borderColor: selected ? C.t2 : C.edge }}
      transition={SPF}
      style={{
        border: `1px solid ${C.edge}`,
        borderRadius: 14, overflow: "hidden",
        cursor: "pointer", background: C.void,
        boxShadow: selected ? `0 0 0 1px ${C.t2}22` : "none",
      }}
    >
      {/* Card header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "9px 14px 8px", borderBottom: `1px solid ${C.sep}`,
      }}>
        <Lbl style={{ fontSize: 8 }}>input_00{index + 1}</Lbl>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: statusColor,
            opacity: status === "pending" ? 0.35 : 1,
          }} />
          <span className="mono" style={{
            fontSize: 8, color: statusColor,
            textTransform: "uppercase", letterSpacing: ".04em",
          }}>{status}</span>
        </div>
      </div>

      {/* Identity body */}
      <div style={{ padding: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <Avatar size={36} color={member.color} imgSrc={member.avatarUrl} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 600, color: C.t1,
              letterSpacing: "-.02em", lineHeight: 1.2, marginBottom: 2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{member.name}</div>
            <div style={{
              fontSize: 11, color: C.t3, lineHeight: 1.3,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{member.title}</div>
          </div>
        </div>

        {/* Hairline */}
        <div style={{ height: 1, background: C.sep, marginBottom: 10 }} />

        {/* Section dots */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
          {sections.map(s => (
            <motion.div
              key={s.id}
              title={s.label}
              animate={{
                background: ST[s.status].dot,
                opacity: s.status === "empty" ? 0.15 : 0.65,
              }}
              style={{ width: 5, height: 5, borderRadius: 1 }}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="mono" style={{ fontSize: 8, color: C.t4 }}>
            {done}/{sections.length} accepted
          </span>
          <span className="mono" style={{ fontSize: 8, color: C.t4 }}>{date}</span>
        </div>
      </div>
    </motion.div>
  );
}
