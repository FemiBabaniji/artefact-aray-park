"use client";

import { useC } from "@/hooks/useC";
import type { CSSProperties } from "react";

type IndicatorStatus = "active" | "inactive" | "warning" | "success";

type IndicatorProps = {
  status?: IndicatorStatus;
  size?: number;
  pulse?: boolean;
  style?: CSSProperties;
};

export function Indicator({
  status = "inactive",
  size = 8,
  pulse,
  style,
}: IndicatorProps) {
  const C = useC();

  const colors: Record<IndicatorStatus, string> = {
    active: C.blue,
    inactive: C.t4,
    warning: C.amber,
    success: C.green,
  };

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: colors[status],
        }}
      />
      {pulse && (
        <div
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: "50%",
            background: colors[status],
            opacity: 0.3,
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}
