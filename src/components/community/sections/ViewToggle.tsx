"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { ViewToggleProps, PreviewViewMode } from "./types";

const OPTIONS: { id: PreviewViewMode; label: string }[] = [
  { id: "workspace", label: "Workspace" },
  { id: "page", label: "Page" },
];

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  const C = useC();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      style={{
        display: "inline-flex",
        borderRadius: 8,
        border: `1px solid ${C.edge}`,
        padding: 3,
        backgroundColor: C.bg,
        gap: 2,
      }}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          style={{
            position: "relative",
            padding: "6px 12px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            color: mode === option.id ? C.t1 : C.t3,
            borderRadius: 6,
            transition: "color 0.15s",
          }}
        >
          {/* Only render layoutId animation after mount to prevent hydration mismatch */}
          {mounted && mode === option.id && (
            <motion.div
              layoutId="view-toggle-bg"
              transition={SPF}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 6,
                backgroundColor: C.sep,
              }}
            />
          )}
          {/* Static background for server render */}
          {!mounted && mode === option.id && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 6,
                backgroundColor: C.sep,
              }}
            />
          )}
          <span style={{ position: "relative", zIndex: 1 }}>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
