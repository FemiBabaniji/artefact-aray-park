"use client";
import { useState, useEffect } from "react";
import { useC } from "@/hooks/useC";
import { MentorAssignment } from "@/components/admin/MentorAssignment";
import type { Member } from "@/types/member";

type MentorAssignmentClientProps = {
  mentors: Pick<Member, "id" | "name" | "initials" | "color">[];
  members: Pick<Member, "id" | "name" | "initials" | "color">[];
};

type Assignment = {
  id: string;
  mentorId: string;
  mentorName: string;
  memberId: string;
  memberName: string;
  active: boolean;
};

export function MentorAssignmentClient({ mentors, members }: MentorAssignmentClientProps) {
  const C = useC();
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Load assignments on mount
  useEffect(() => {
    fetch("/api/mentor-assignments")
      .then(res => res.json())
      .then(setAssignments)
      .catch(console.error);
  }, []);

  const handleAssign = async (mentorId: string, memberId: string) => {
    const res = await fetch("/api/mentor-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentorId, memberId }),
    });
    const newAssignment = await res.json();

    // Find names for display
    const mentor = mentors.find(m => m.id === mentorId);
    const member = members.find(m => m.id === memberId);

    setAssignments(prev => [...prev, {
      ...newAssignment,
      mentorName: mentor?.name || "Unknown",
      memberName: member?.name || "Unknown",
    }]);
  };

  const handleUnassign = async (assignmentId: string) => {
    await fetch(`/api/mentor-assignments?id=${assignmentId}`, { method: "DELETE" });
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: C.t1, marginBottom: 24 }}>
        Mentor Assignments
      </h1>
      <MentorAssignment
        mentors={mentors}
        members={members}
        assignments={assignments}
        onAssign={handleAssign}
        onUnassign={handleUnassign}
      />
    </div>
  );
}
