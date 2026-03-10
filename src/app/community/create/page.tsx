"use client";

import { ThemeProvider } from "@/context/ThemeProvider";
import { CommunityCreateWizard } from "@/components/community/CommunityCreateWizard";
import { useC } from "@/hooks/useC";

function CommunityCreateContent() {
  const C = useC();

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: C.void,
      }}
    >
      <CommunityCreateWizard />
    </div>
  );
}

export default function CommunityCreatePage() {
  return (
    <ThemeProvider>
      <CommunityCreateContent />
    </ThemeProvider>
  );
}
