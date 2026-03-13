"use client";

import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";

type CardProps = {
  children?: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  padding?: number | string;
  radius?: number;
  accent?: string;
  style?: CSSProperties;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, onClick, active, disabled, padding = 16, radius = 10, accent, style },
  ref
) {
  const C = useC();
  const isInteractive = !!onClick && !disabled;
  const accentColor = accent || C.blue;

  return (
    <motion.div
      ref={ref}
      onClick={disabled ? undefined : onClick}
      whileHover={isInteractive ? { borderColor: accentColor } : undefined}
      whileTap={isInteractive ? { scale: 0.995 } : undefined}
      transition={SPF}
      style={{
        background: active ? `${accentColor}08` : C.bg,
        border: `1px solid ${active ? accentColor : C.edge}`,
        borderRadius: radius,
        padding,
        cursor: isInteractive ? "pointer" : "default",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
});
