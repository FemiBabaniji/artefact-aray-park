"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE } from "@/lib/motion";
import { Btn } from "@/components/primitives/Btn";
import { Lbl } from "@/components/primitives/Lbl";
import type { Member } from "@/types/member";

type Assignment = {
  id: string;
  mentorId: string;
  mentorName: string;
  memberId: string;
  memberName: string;
  active: boolean;
};

type MentorAssignmentProps = {
  mentors: Pick<Member, "id" | "name" | "initials" | "color">[];
  members: Pick<Member, "id" | "name" | "initials" | "color">[];
  assignments: Assignment[];
  onAssign?: (mentorId: string, memberId: string) => Promise<void>;
  onUnassign?: (assignmentId: string) => Promise<void>;
};

export function MentorAssignment({ mentors, members, assignments, onAssign, onUnassign }: MentorAssignmentProps) {
  const C = useC();
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const getMentorAssignments = (mentorId: string) =>
    assignments.filter(a => a.mentorId === mentorId && a.active);

  const getUnassignedMembers = (mentorId: string) => {
    const assignedIds = getMentorAssignments(mentorId).map(a => a.memberId);
    return members.filter(m => !assignedIds.includes(m.id));
  };

  const handleAssign = async (mentorId: string, memberId: string) => {
    if (!onAssign) return;
    setAssigning(true);
    try {
      await onAssign(mentorId, memberId);
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    if (!onUnassign) return;
    await onUnassign(assignmentId);
  };

  return (
    <div style={{ background: C.void, border: `1px solid ${C.edge}`, borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.sep}` }}>
        <Lbl>mentor assignments</Lbl>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", minHeight: 300 }}>
        {/* Mentor list */}
        <div style={{ borderRight: `1px solid ${C.sep}`, padding: "12px 0" }}>
          {mentors.map(mentor => {
            const count = getMentorAssignments(mentor.id).length;
            const isSelected = selectedMentor === mentor.id;

            return (
              <div
                key={mentor.id}
                onClick={() => setSelectedMentor(isSelected ? null : mentor.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
                  cursor: "pointer", background: isSelected ? C.sep + "33" : "transparent",
                  transition: "background 0.1s",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 6, background: mentor.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.9)",
                }}>
                  {mentor.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: C.t1, fontWeight: 500 }}>{mentor.name}</div>
                  <div style={{ fontSize: 10, color: C.t4 }}>
                    {count} member{count !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            );
          })}

          {mentors.length === 0 && (
            <div style={{ padding: "24px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 12, color: C.t4 }}>No mentors yet</div>
            </div>
          )}
        </div>

        {/* Assignment panel */}
        <div style={{ padding: 16 }}>
          <AnimatePresence mode="wait">
            {selectedMentor ? (
              <motion.div key={selectedMentor} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}>
                {/* Current assignments */}
                <div style={{ marginBottom: 20 }}>
                  <Lbl style={{ marginBottom: 12, display: "block" }}>assigned members</Lbl>
                  {getMentorAssignments(selectedMentor).length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {getMentorAssignments(selectedMentor).map(a => (
                        <div
                          key={a.id}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "6px 10px", background: C.sep + "44", borderRadius: 6,
                          }}
                        >
                          <span style={{ fontSize: 12, color: C.t2 }}>{a.memberName}</span>
                          <Btn
                            onClick={() => handleUnassign(a.id)}
                            style={{ fontSize: 10, color: C.t4, padding: "2px 4px" }}
                          >
                            ×
                          </Btn>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: C.t4 }}>No members assigned</div>
                  )}
                </div>

                {/* Add assignment */}
                <div>
                  <Lbl style={{ marginBottom: 12, display: "block" }}>add member</Lbl>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {getUnassignedMembers(selectedMentor).map(member => (
                      <Btn
                        key={member.id}
                        onClick={() => handleAssign(selectedMentor, member.id)}
                        disabled={assigning}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "6px 10px", fontSize: 12,
                        }}
                      >
                        <span style={{
                          width: 16, height: 16, borderRadius: 4, background: member.color,
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          fontSize: 7, fontWeight: 600, color: "rgba(255,255,255,0.9)",
                        }}>
                          {member.initials}
                        </span>
                        {member.name}
                      </Btn>
                    ))}
                    {getUnassignedMembers(selectedMentor).length === 0 && (
                      <div style={{ fontSize: 12, color: C.t4 }}>All members assigned</div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 200 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>←</div>
                  <div style={{ fontSize: 13, color: C.t3 }}>Select a mentor</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
