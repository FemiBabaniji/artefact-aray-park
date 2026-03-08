"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls, PanInfo } from "framer-motion";
import { useC } from "@/hooks/useC";

type MobileSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: "auto" | "full" | "half";
};

export function MobileSheet({ open, onClose, title, children, height = "auto" }: MobileSheetProps) {
  const C = useC();
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Close if dragged down significantly
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const heightStyles: Record<string, React.CSSProperties> = {
    auto: { maxHeight: "85vh" },
    full: { height: "calc(100vh - 40px)" },
    half: { height: "50vh" },
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.5)",
            }}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201,
              background: C.void, borderTopLeftRadius: 16, borderTopRightRadius: 16,
              overflow: "hidden", display: "flex", flexDirection: "column",
              ...heightStyles[height],
            }}
          >
            {/* Drag handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              style={{
                padding: "12px 0 8px", display: "flex", justifyContent: "center",
                cursor: "grab", touchAction: "none",
              }}
            >
              <div style={{
                width: 36, height: 4, borderRadius: 2, background: C.sep,
              }} />
            </div>

            {/* Header */}
            {title && (
              <div style={{
                padding: "0 20px 12px", borderBottom: `1px solid ${C.sep}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.t1 }}>{title}</span>
                <button
                  onClick={onClose}
                  style={{
                    background: "none", border: "none", padding: "4px 8px",
                    fontSize: 14, color: C.t3, cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, overflow: "auto", WebkitOverflowScrolling: "touch" }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
