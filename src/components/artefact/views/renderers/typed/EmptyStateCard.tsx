"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";

export type EmptyStateVariant = "folder" | "workspace" | "artifact" | "room";

type EmptyStateCardProps = {
  variant: EmptyStateVariant;
  title: string;
  description: string;
  buttonLabel: string;
  onAction: () => void;
  accent?: string;
};

// Preview mockups for each variant
function FolderPreview({ C }: { C: ReturnType<typeof useC> }) {
  return (
    <div
      style={{
        width: 80,
        height: 64,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Folder shape */}
      <div
        style={{
          width: 64,
          height: 48,
          borderRadius: 6,
          border: `1.5px solid ${C.sep}`,
          background: C.bg,
          position: "relative",
        }}
      >
        {/* Folder tab */}
        <div
          style={{
            position: "absolute",
            top: -8,
            left: 8,
            width: 20,
            height: 8,
            borderRadius: "4px 4px 0 0",
            border: `1.5px solid ${C.sep}`,
            borderBottom: "none",
            background: C.bg,
          }}
        />
        {/* Plus icon */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 16,
            color: C.t4,
            fontWeight: 300,
          }}
        >
          +
        </div>
      </div>
    </div>
  );
}

function WorkspacePreview({ C, accent }: { C: ReturnType<typeof useC>; accent?: string }) {
  const accentColor = accent || C.t4;
  return (
    <div
      style={{
        width: 140,
        height: 90,
        borderRadius: 8,
        border: `1px solid ${C.sep}`,
        background: C.bg,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Window header */}
      <div
        style={{
          height: 20,
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          gap: 4,
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.sep }} />
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.sep }} />
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.sep }} />
      </div>
      {/* Content area */}
      <div
        style={{
          padding: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        {/* Logo placeholder */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: accentColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "rgba(0,0,0,0.4)",
          }}
        >
          C
        </div>
        {/* Lines */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.sep }} />
        <div style={{ width: 28, height: 3, borderRadius: 2, background: C.sep }} />
      </div>
    </div>
  );
}

function ArtifactPreview({ C }: { C: ReturnType<typeof useC> }) {
  return (
    <div
      style={{
        width: 160,
        height: 80,
        borderRadius: 8,
        border: `1px solid ${C.sep}`,
        background: C.bg,
        overflow: "hidden",
      }}
    >
      {/* Toolbar mockup */}
      <div
        style={{
          height: 28,
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          gap: 8,
        }}
      >
        <div style={{ width: 32, height: 6, borderRadius: 3, background: C.t1 }} />
        <div style={{ width: 24, height: 6, borderRadius: 3, background: C.sep }} />
        <div style={{ width: 28, height: 6, borderRadius: 3, background: C.sep }} />
      </div>
      {/* Content lines */}
      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ width: "80%", height: 5, borderRadius: 2, background: C.sep }} />
        <div style={{ width: "60%", height: 5, borderRadius: 2, background: C.sep }} />
        <div style={{ width: "70%", height: 5, borderRadius: 2, background: C.sep }} />
      </div>
    </div>
  );
}

function RoomPreview({ C }: { C: ReturnType<typeof useC> }) {
  return (
    <div
      style={{
        width: 100,
        height: 70,
        borderRadius: 8,
        border: `1px dashed ${C.sep}`,
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <div style={{ width: 24, height: 24, borderRadius: 6, background: C.sep }} />
      <div style={{ width: 40, height: 4, borderRadius: 2, background: C.sep }} />
    </div>
  );
}

export function EmptyStateCard({
  variant,
  title,
  description,
  buttonLabel,
  onAction,
  accent,
}: EmptyStateCardProps) {
  const C = useC();

  const renderPreview = () => {
    switch (variant) {
      case "folder":
        return <FolderPreview C={C} />;
      case "workspace":
        return <WorkspacePreview C={C} accent={accent} />;
      case "artifact":
        return <ArtifactPreview C={C} />;
      case "room":
        return <RoomPreview C={C} />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        textAlign: "center",
        gap: 16,
      }}
    >
      {/* Preview mockup */}
      <div style={{ marginBottom: 8 }}>{renderPreview()}</div>

      {/* Title */}
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: C.t1,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 13,
          color: C.t3,
          lineHeight: 1.5,
          maxWidth: 280,
        }}
      >
        {description}
      </div>

      {/* CTA Button */}
      <motion.button
        onClick={onAction}
        whileHover={{ scale: 1.02, background: C.bg }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 20px",
          borderRadius: 8,
          border: `1px solid ${C.sep}`,
          background: "transparent",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          color: C.t1,
          marginTop: 8,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 400 }}>+</span>
        {buttonLabel}
      </motion.button>
    </div>
  );
}
