"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { SectionFrameProps } from "./types";

export function SectionFrame({
  title,
  children,
  divider = true,
  isEmpty = false,
  emptyLabel,
  variant = "standard",
  showSeparator = false,
}: SectionFrameProps) {
  const C = useC();

  // Hero variant - full-width with generous padding
  if (variant === "hero") {
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={SPF}
        style={{
          width: "100vw",
          marginLeft: "calc(-50vw + 50%)",
          background: C.void,
          borderBottom: `1px solid ${C.sep}`,
        }}
      >
        {children}
      </motion.section>
    );
  }

  // Standard variant with section separator
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPF}
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "0 24px",
      }}
    >
      {/* Section separator with label */}
      {showSeparator && title && (
        <div
          style={{
            marginTop: 80,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: C.t4,
              marginBottom: 12,
            }}
          >
            {title}
          </div>
          <div
            style={{
              height: 1,
              backgroundColor: C.sep,
            }}
          />
        </div>
      )}

      {/* Standard section title (when not using separator) */}
      {title && !showSeparator && (
        <h2
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: C.t3,
            marginBottom: 16,
          }}
        >
          {title}
        </h2>
      )}

      {isEmpty ? (
        <div
          style={{
            border: `1px dashed ${C.t4}`,
            borderRadius: 8,
            padding: "32px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: `${C.t4}10`,
          }}
        >
          <span style={{ color: C.t3, fontSize: 13 }}>
            {emptyLabel || "Add content"}
          </span>
        </div>
      ) : (
        children
      )}

      {divider && (
        <div
          style={{
            height: 1,
            backgroundColor: C.sep,
            marginTop: 48,
            marginBottom: 48,
          }}
        />
      )}
    </motion.section>
  );
}
