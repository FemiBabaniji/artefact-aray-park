"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import type { CSSProperties, ReactNode } from "react";

type ListRowProps = {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  divider?: boolean;
  padding?: string;
  style?: CSSProperties;
};

export function ListRow({
  children,
  onClick,
  active,
  disabled,
  leading,
  trailing,
  divider = true,
  padding = "12px 16px",
  style,
}: ListRowProps) {
  const C = useC();
  const isInteractive = !!onClick && !disabled;

  return (
    <motion.div
      onClick={disabled ? undefined : onClick}
      whileHover={isInteractive ? { background: `${C.t4}10` } : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding,
        borderBottom: divider ? `1px solid ${C.sep}` : undefined,
        background: active ? `${C.blue}08` : "transparent",
        cursor: isInteractive ? "pointer" : "default",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {leading}
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {trailing}
    </motion.div>
  );
}

// Sub-components for consistent text styling
export function ListRowTitle({ children }: { children: ReactNode }) {
  const C = useC();
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 500,
        color: C.t1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

export function ListRowSubtitle({ children }: { children: ReactNode }) {
  const C = useC();
  return (
    <div
      style={{
        fontSize: 11,
        color: C.t3,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        marginTop: 1,
      }}
    >
      {children}
    </div>
  );
}
