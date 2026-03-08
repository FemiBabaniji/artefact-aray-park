"use client";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useC } from "@/hooks/useC";
import { WalkthroughOverlay } from "@/components/walkthrough/WalkthroughOverlay";
import { ThemeToggle } from "@/components/primitives/ThemeToggle";
import { STEPS } from "@/components/walkthrough/WalkthroughOverlay";

export default function WalkthroughLayout({ children }: { children: React.ReactNode }) {
  const C        = useC();
  const pathname = usePathname();
  const [guide, setGuide] = useState(true);

  // Derive header from current step
  const cur = STEPS.find(s => pathname.startsWith(s.path)) ?? STEPS[0];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.sep}`, flexShrink: 0, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 9, color: C.t4, fontFamily: "'DM Mono',monospace", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 3 }}>
            {cur.id === "apply"     ? "creative incubator · application" :
             cur.id === "portfolio" ? "artefact" :
             cur.id === "queue"     ? "admin · review queue" :
             cur.id === "paths"     ? "admin · program paths" :
             cur.id === "accepted"  ? "member portal" :
             cur.id === "community" ? "admin · cohort" :
             cur.id === "link"      ? "public · link page" : ""}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: C.t1, letterSpacing: "-.025em", lineHeight: 1.2 }}>
            {cur.title}.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ThemeToggle />
          <button
            onClick={() => setGuide(v => !v)}
            style={{ padding: "5px 12px", border: `1px solid ${C.sep}`, borderRadius: 6, background: "transparent", color: C.t3, fontSize: 8, fontFamily: "'DM Mono',monospace", letterSpacing: ".05em", textTransform: "uppercase", cursor: "pointer" }}>
            {guide ? "hide guide" : "show guide"}
          </button>
        </div>
      </div>

      {/* Page content */}
      <div style={{ flex: 1, minHeight: 0, paddingBottom: guide ? 72 : 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </div>

      {/* Walkthrough overlay — reads pathname, not step state */}
      {guide && <WalkthroughOverlay pathname={pathname} />}
    </div>
  );
}
