"use client";
import { useC } from "@/hooks/useC";
import { InviteUpload } from "@/components/admin/InviteUpload";

export default function AdminInvitesPage() {
  const C = useC();

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: C.t1, marginBottom: 24 }}>
        Invite Members
      </h1>
      <InviteUpload
        communityName="Creative Incubator"
        programName="Spring 2026 Cohort"
        onComplete={(results) => {
          console.log("Invites sent:", results);
        }}
      />
    </div>
  );
}
