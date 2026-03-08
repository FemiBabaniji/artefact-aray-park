"use client";

import { useMemo } from "react";
import { useDemoConfig } from "@/context/DemoConfigContext";
import { Artefact } from "@/components/artefact/Artefact";
import { DEMO_MEMBER } from "@/lib/data/demo-members";
import type { Section } from "@/types/section";

export function DemoPreview() {
  const { config } = useDemoConfig();

  // Map configured sections to demo member's sections
  // This updates section labels based on config while keeping status/evidence
  // Note: Using type assertion because SectionKey is hardcoded but demo allows custom IDs
  const sections = useMemo(() => {
    return config.sections.map((configSection) => {
      // Find matching section in demo data or use defaults
      const demoSection = DEMO_MEMBER.sections.find(
        (s) => s.id === configSection.id
      );

      return {
        id: configSection.id,
        label: configSection.label,
        status: demoSection?.status ?? "empty",
        evidence: demoSection?.evidence ?? "",
        cp: configSection.cp,
        feedback: demoSection?.feedback,
        feedbackAt: demoSection?.feedbackAt,
        feedbackBy: demoSection?.feedbackBy,
      };
    }) as Section[];
  }, [config.sections]);

  // Create member with configured community name in context
  const member = useMemo(
    () => ({
      ...DEMO_MEMBER.member,
      // Sections count matches config
      sections: config.sections.length,
      accepted: sections.filter((s) => s.status === "accepted").length,
    }),
    [config.sections.length, sections]
  );

  return (
    <Artefact
      member={member}
      sections={sections}
      role="admin"
      syncing={false}
      compact={false}
      onToggleCompact={() => {}}
      avatarSrc={null}
    />
  );
}
