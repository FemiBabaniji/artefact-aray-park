"use client";

import { FullscreenShell } from "@/components/layout/FullscreenShell";
import { ArtefactDashboard } from "@/components/create/ArtefactDashboard";

export default function CreatePage() {
  return (
    <FullscreenShell>
      <ArtefactDashboard />
    </FullscreenShell>
  );
}
