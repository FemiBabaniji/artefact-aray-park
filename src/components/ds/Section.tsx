"use client";

import { useC } from "@/hooks/useC";
import type { CSSProperties, ReactNode } from "react";

type SectionProps = {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  style?: CSSProperties;
};

export function Section({ title, children, action, style }: SectionProps) {
  const C = useC();

  return (
    <div style={style}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: C.t4,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {title}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}
