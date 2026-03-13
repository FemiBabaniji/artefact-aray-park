"use client";

import { useMemo } from "react";
import type { EngagementPhase } from "@/types/engagement";
import { getPhaseLabel } from "@/types/engagement";
import { Surface } from "@/components/ds/Surface";
import { Stepper } from "@/components/ds/Stepper";
import { Badge } from "@/components/ds/Badge";

type PhaseTimelineProps = {
  currentPhase: EngagementPhase;
  transitions: Array<{
    id: string;
    from_phase: string | null;
    to_phase: string;
    created_at: string;
  }>;
  onPhaseClick?: (phase: EngagementPhase) => void;
  C: Record<string, string>;
};

const PHASES: EngagementPhase[] = [
  "intake",
  "qualification",
  "proposal",
  "negotiation",
  "signed",
  "delivery",
  "completed",
];

export function PhaseTimeline({ currentPhase, transitions, onPhaseClick, C }: PhaseTimelineProps) {
  const isArchived = currentPhase === "archived";

  const steps = useMemo(
    () => PHASES.map((phase) => ({ key: phase, label: getPhaseLabel(phase) })),
    []
  );

  const completedSteps = useMemo(() => {
    const currentIndex = PHASES.indexOf(currentPhase);
    return PHASES.slice(0, currentIndex);
  }, [currentPhase]);

  const handleStepClick = (step: string) => {
    onPhaseClick?.(step as EngagementPhase);
  };

  if (isArchived) {
    return (
      <Surface padding={20}>
        <div style={{ textAlign: "center" }}>
          <Badge variant="muted" size="md">
            Archived
          </Badge>
          <div style={{ fontSize: 12, color: C.t3, marginTop: 8 }}>
            This engagement has been archived
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <Surface padding="20px 24px">
      <Stepper
        steps={steps}
        currentStep={currentPhase}
        completedSteps={completedSteps}
        onStepClick={onPhaseClick ? handleStepClick : undefined}
      />
    </Surface>
  );
}
