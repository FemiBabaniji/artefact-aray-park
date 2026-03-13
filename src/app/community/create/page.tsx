"use client";

import { FullscreenShell } from "@/components/layout/FullscreenShell";
import { CommunityCreateWizard } from "@/components/community/CommunityCreateWizard";
import { useC } from "@/hooks/useC";

function CommunityCreateContent() {
  const C = useC();

  return (
    <FullscreenShell background={C.void}>
      <CommunityCreateWizard />
    </FullscreenShell>
  );
}

export default function CommunityCreatePage() {
  return <CommunityCreateContent />;
}
