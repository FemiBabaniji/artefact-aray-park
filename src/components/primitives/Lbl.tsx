"use client";
import { useC } from "@/hooks/useC";
import type { CSSProperties, MouseEventHandler } from "react";

type LblProps = {
  children: React.ReactNode;
  style?:   CSSProperties;
  onClick?: MouseEventHandler<HTMLSpanElement>;
};

export function Lbl({ children, style, onClick }: LblProps) {
  const C = useC();
  return (
    <span
      className="mono"
      onClick={onClick}
      style={{ fontSize: 9, color: C.t3, textTransform: "uppercase", letterSpacing: ".07em", ...style }}
    >
      {children}
    </span>
  );
}
