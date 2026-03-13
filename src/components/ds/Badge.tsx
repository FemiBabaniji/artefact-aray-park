"use client";

import { useC } from "@/hooks/useC";
import type { CSSProperties, ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "info" | "muted";
type BadgeSize = "sm" | "md";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: string;
  style?: CSSProperties;
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  color,
  style,
}: BadgeProps) {
  const C = useC();

  const colors: Record<BadgeVariant, { bg: string; fg: string }> = {
    default: { bg: `${C.blue}15`, fg: C.blue },
    success: { bg: `${C.green}15`, fg: C.green },
    warning: { bg: `${C.amber}15`, fg: C.amber },
    info: { bg: `${C.t4}40`, fg: C.t2 },
    muted: { bg: C.void, fg: C.t4 },
  };

  const c = color ? { bg: `${color}15`, fg: color } : colors[variant];
  const padding = size === "sm" ? "2px 6px" : "3px 10px";
  const fontSize = size === "sm" ? 10 : 11;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding,
        fontSize,
        fontWeight: 500,
        borderRadius: 4,
        background: c.bg,
        color: c.fg,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
