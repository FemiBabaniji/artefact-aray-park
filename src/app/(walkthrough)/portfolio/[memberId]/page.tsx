"use client";
import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { useC } from "@/hooks/useC";
import { Artefact } from "@/components/artefact/Artefact";
import { INIT, MEMBERS } from "@/lib/data/seed";
import type { Section } from "@/types/section";

export default function PortfolioPage() {
  const C = useC();
  const params = useParams();
  const memberId = params.memberId as string;

  // Find member by ID
  const member = MEMBERS.find(m => m.id === memberId);

  // Show 404 if member not found
  if (!member) {
    notFound();
  }

  // Get sections for this member (in stub mode, only "am" has real data)
  const initialSections = memberId === "am" ? INIT : INIT.map(s => ({
    ...s, status: "empty" as const, evidence: "", feedback: undefined, feedbackAt: undefined
  }));

  const [sections,   setSections]   = useState<Section[]>(initialSections);
  const [compact,    setCompact]    = useState(true);
  const [avatarSrc,  setAvatarSrc]  = useState<string | null>(null);
  const [syncing,    setSyncing]    = useState(false);

  // On first visit reset to compact (onboarding)
  useEffect(() => { setCompact(true); }, []);

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 32 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%", maxHeight: "100%", overflow: "hidden" }}>
        {compact && (
          <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.6, textAlign: "center", maxWidth: 280 }}>
            This is your artefact. It holds your identity, your work, and your progress.<br />
            <span style={{ color: C.t4 }}>Expand it to start building.</span>
          </div>
        )}
        <Artefact
          member={member}
          sections={sections}
          setSections={setSections}
          role="member"
          syncing={syncing}
          compact={compact}
          onToggleCompact={() => setCompact(false)}
          avatarSrc={avatarSrc}
          onAvatarChange={setAvatarSrc}
        />
      </div>
    </div>
  );
}
