"use client";

import { useC } from "@/hooks/useC";
import type { CSSProperties, ReactNode } from "react";

type StatSize = "sm" | "md" | "lg";

type StatProps = {
  value: ReactNode;
  label: string;
  size?: StatSize;
  accent?: string;
  style?: CSSProperties;
};

const sizes: Record<StatSize, { value: number; label: number; gap: number }> = {
  sm: { value: 18, label: 9, gap: 2 },
  md: { value: 28, label: 10, gap: 4 },
  lg: { value: 36, label: 11, gap: 6 },
};

export function Stat({ value, label, size = "md", accent, style }: StatProps) {
  const C = useC();
  const s = sizes[size];

  return (
    <div style={style}>
      <div
        style={{
          fontSize: s.label,
          fontWeight: 500,
          color: C.t4,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: s.gap,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: s.value,
          fontWeight: 600,
          color: accent || C.t1,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}
