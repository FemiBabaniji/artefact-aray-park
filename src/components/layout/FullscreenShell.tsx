"use client";

import type { CSSProperties, ReactNode } from "react";

type FullscreenShellProps = {
  children: ReactNode;
  background?: string;
  className?: string;
  style?: CSSProperties;
};

export function FullscreenShell({
  children,
  background,
  className,
  style,
}: FullscreenShellProps) {
  return (
    <div
      className={className}
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
