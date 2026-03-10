"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { TOUCH } from "@/lib/breakpoints";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  badge?: number;
};

type MobileNavProps = {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  accent: string;
};

export function MobileNav({ items, activeId, onSelect, accent }: MobileNavProps) {
  const C = useC();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        background: C.bg,
        borderTop: `1px solid ${C.sep}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 8px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        zIndex: 50,
      }}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <motion.button
            key={item.id}
            onClick={() => onSelect(item.id)}
            whileTap={{ scale: 0.95 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              minWidth: TOUCH.minTarget,
              minHeight: TOUCH.minTarget,
              padding: "8px 12px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <span
              style={{
                fontSize: 20,
                color: isActive ? accent : C.t3,
                transition: "color 0.15s",
              }}
            >
              {item.icon}
            </span>
            <span
              style={{
                fontSize: 10,
                color: isActive ? accent : C.t4,
                fontWeight: isActive ? 600 : 400,
                transition: "color 0.15s",
              }}
            >
              {item.label}
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 8,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  background: accent,
                  color: "#000",
                  fontSize: 9,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                }}
              >
                {item.badge}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="mobile-nav-indicator"
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 24,
                  height: 3,
                  borderRadius: 2,
                  background: accent,
                }}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}
