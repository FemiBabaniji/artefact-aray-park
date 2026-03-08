"use client";
import { useC } from "@/hooks/useC";
import type { CSSProperties } from "react";

export function HR({ style }: { style?: CSSProperties }) {
  const C = useC();
  return <div style={{ height: 1, background: C.sep, ...style }} />;
}

export function VR({ style }: { style?: CSSProperties }) {
  const C = useC();
  return <div style={{ width: 1, background: C.sep, alignSelf: "stretch", ...style }} />;
}
