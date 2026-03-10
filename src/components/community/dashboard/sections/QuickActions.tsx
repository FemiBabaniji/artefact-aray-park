"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";

type QuickActionsProps = {
  communityId: string;
  onInvite: () => void;
  onCreatePath: () => void;
  onExport: () => void;
  onShare: () => void;
};

export function QuickActions({
  onInvite,
  onCreatePath,
  onExport,
  onShare,
}: QuickActionsProps) {
  const C = useC();

  const actions = [
    { label: "Invite members", onClick: onInvite, primary: true },
    { label: "Create path", onClick: onCreatePath },
    { label: "Export directory", onClick: onExport },
    { label: "Share", onClick: onShare },
  ];

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
      {actions.map((action) => (
        <motion.button
          key={action.label}
          onClick={action.onClick}
          whileHover={{ opacity: 0.85 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: "6px 12px",
            background: action.primary ? C.blue : "transparent",
            border: action.primary ? "none" : `1px solid ${C.sep}`,
            borderRadius: 6,
            color: action.primary ? "#fff" : C.t2,
            fontSize: 11,
            fontWeight: 500,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {action.label}
        </motion.button>
      ))}
    </div>
  );
}
