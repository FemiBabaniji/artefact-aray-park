"use client";
import { useC } from "@/hooks/useC";
import type { CSSProperties } from "react";

type LblProps = {
  children: React.ReactNode;
  style?:   CSSProperties;
};

export function Lbl({ children, style }: LblProps) {
  const C = useC();
  return (
    <span
      className="mono"
      style={{ fontSize: 9, color: C.t3, textTransform: "uppercase", letterSpacing: ".07em", ...style }}
    >
      {children}
    </span>
  );
}
