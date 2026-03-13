"use client";

import { useC } from "@/hooks/useC";
import type { CSSProperties, ReactNode } from "react";

type EmptyProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  style?: CSSProperties;
};

export function Empty({
  title = "Nothing here yet",
  description,
  action,
  compact,
  style,
}: EmptyProps) {
  const C = useC();

  return (
    <div
      style={{
        padding: compact ? "20px 16px" : "40px 24px",
        textAlign: "center",
        ...style,
      }}
    >
      <div
        style={{
          fontSize: compact ? 12 : 13,
          color: C.t3,
          marginBottom: description || action ? 4 : 0,
        }}
      >
        {title}
      </div>
      {description && (
        <div
          style={{
            fontSize: 11,
            color: C.t4,
            marginBottom: action ? 12 : 0,
          }}
        >
          {description}
        </div>
      )}
      {action}
    </div>
  );
}
