"use client";
import { useState } from "react";
import { useC } from "@/hooks/useC";
import { SetupChecklist, DEFAULT_SETUP_STEPS } from "@/components/admin/SetupChecklist";

export default function AdminSetupPage() {
  const C = useC();

  // In production, this would be fetched from community_setup table
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const steps = DEFAULT_SETUP_STEPS.map(step => ({
    ...step,
    done: completedSteps.includes(step.id),
    action: () => {
      // Navigate to respective setup page or open modal
      console.log(`Setup action for: ${step.id}`);
    },
  }));

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => [...prev, stepId]);
  };

  return (
    <div style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: C.t1, marginBottom: 8 }}>
        Welcome to Artefact
      </h1>
      <p style={{ fontSize: 13, color: C.t3, marginBottom: 24, lineHeight: 1.6 }}>
        Complete the setup steps below to configure your community and start inviting members.
      </p>
      <SetupChecklist
        communityName="Your Community"
        steps={steps}
        onStepComplete={handleStepComplete}
      />
    </div>
  );
}
