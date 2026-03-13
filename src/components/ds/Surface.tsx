"use client";

import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { useC } from "@/hooks/useC";

export type SurfaceVariant = "default" | "sunken" | "raised" | "ghost";

type SurfaceProps = {
  children?: ReactNode;
  variant?: SurfaceVariant;
  padding?: number | string;
  radius?: number;
  style?: CSSProperties;
  className?: string;
} & Omit<HTMLMotionProps<"div">, "style">;

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  function Surface(
    { children, variant = "default", padding = 16, radius = 10, style, className, ...props },
    ref
  ) {
    const C = useC();

    const variants: Record<SurfaceVariant, CSSProperties> = {
      default: {
        background: C.bg,
        border: `1px solid ${C.edge}`,
      },
      sunken: {
        background: C.void,
        border: `1px solid ${C.sep}`,
      },
      raised: {
        background: C.bg,
        border: `1px solid ${C.edge}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      },
      ghost: {
        background: "transparent",
        border: "1px solid transparent",
      },
    };

    return (
      <motion.div
        ref={ref}
        className={className}
        style={{
          borderRadius: radius,
          padding,
          ...variants[variant],
          ...style,
        }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
