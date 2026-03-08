"use client";
import { useState, useRef } from "react";

export function useHover(delay = 380) {
  const [on, setOn] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return {
    active: on,
    onMouseEnter: () => { t.current = setTimeout(() => setOn(true), delay); },
    onMouseLeave: () => { if (t.current) clearTimeout(t.current); setOn(false); },
  };
}
