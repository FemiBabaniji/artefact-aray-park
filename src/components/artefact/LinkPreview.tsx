"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE, SP } from "@/lib/motion";
import type { LinkMeta } from "@/types/section";

type LinkPreviewProps = {
  link:      LinkMeta;
  compact?:  boolean;
  onRemove?: () => void;
};

export function LinkPreview({ link, compact = false, onRemove }: LinkPreviewProps) {
  const C = useC();
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  const domain = (() => {
    try {
      return new URL(link.url).hostname.replace("www.", "");
    } catch {
      return link.url;
    }
  })();

  const handleClick = () => {
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  // Loading state
  if (!link.fetched && !link.error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={FADE}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          background: C.sep + "44",
          borderRadius: 6,
          border: `1px solid ${C.sep}`,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: `2px solid ${C.t4}`,
            borderTopColor: "transparent",
            animation: "spin 1s linear infinite",
          }}
        />
        <span style={{ fontSize: 11, color: C.t4, fontFamily: "'DM Mono', monospace" }}>
          fetching preview...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    );
  }

  // Error state
  if (link.error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={FADE}
        onClick={handleClick}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          background: C.sep + "22",
          borderRadius: 6,
          border: `1px solid ${C.sep}`,
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 11, color: C.t3 }}>
          {domain}
        </span>
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{
              marginLeft: "auto",
              fontSize: 10,
              color: C.t4,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            x
          </button>
        )}
      </motion.div>
    );
  }

  // Compact mode - just favicon + domain
  if (compact) {
    return (
      <motion.a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ opacity: 0.8 }}
        transition={FADE}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 7px",
          background: C.sep + "33",
          borderRadius: 4,
          textDecoration: "none",
          fontSize: 10,
          color: C.blue,
        }}
      >
        {link.favicon && !imgError && (
          <img
            src={link.favicon}
            alt=""
            onError={() => setImgError(true)}
            style={{ width: 12, height: 12, borderRadius: 2 }}
          />
        )}
        <span>{domain}</span>
      </motion.a>
    );
  }

  // Full preview card
  const hasImage = link.image && !imgError;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={SP}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      style={{
        display: "flex",
        flexDirection: hasImage ? "row" : "column",
        gap: hasImage ? 12 : 6,
        padding: 10,
        background: C.void,
        borderRadius: 8,
        border: `1px solid ${hovered ? C.blue + "66" : C.sep}`,
        cursor: "pointer",
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
    >
      {/* Thumbnail */}
      {hasImage && (
        <div
          style={{
            width: 80,
            height: 60,
            borderRadius: 5,
            overflow: "hidden",
            flexShrink: 0,
            background: C.sep,
          }}
        >
          <img
            src={link.image}
            alt=""
            onError={() => setImgError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Title */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: C.t1,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {link.title || domain}
        </div>

        {/* Description */}
        {link.description && (
          <div
            style={{
              fontSize: 11,
              color: C.t3,
              lineHeight: 1.45,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {link.description}
          </div>
        )}

        {/* Domain + type badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          {link.favicon && (
            <img
              src={link.favicon}
              alt=""
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              style={{ width: 12, height: 12, borderRadius: 2 }}
            />
          )}
          <span
            style={{
              fontSize: 10,
              color: C.t4,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {domain}
          </span>
          {link.type && link.type !== "website" && (
            <span
              style={{
                fontSize: 8,
                color: C.t4,
                background: C.sep,
                padding: "1px 4px",
                borderRadius: 3,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              {link.type}
            </span>
          )}
        </div>
      </div>

      {/* Remove button */}
      <AnimatePresence>
        {onRemove && hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.1 }}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 18,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: C.t3,
              background: C.void,
              border: `1px solid ${C.sep}`,
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            x
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Grid of link previews
type LinkPreviewGridProps = {
  links:      LinkMeta[];
  compact?:   boolean;
  onRemove?:  (index: number) => void;
  maxItems?:  number;
};

export function LinkPreviewGrid({ links, compact, onRemove, maxItems = 4 }: LinkPreviewGridProps) {
  const C = useC();
  const visible = links.slice(0, maxItems);
  const overflow = links.length - maxItems;

  if (links.length === 0) return null;

  if (compact) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {visible.map((link, i) => (
          <LinkPreview
            key={link.url}
            link={link}
            compact
            onRemove={onRemove ? () => onRemove(i) : undefined}
          />
        ))}
        {overflow > 0 && (
          <span style={{ fontSize: 10, color: C.t4, alignSelf: "center" }}>
            +{overflow} more
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <AnimatePresence mode="popLayout">
        {visible.map((link, i) => (
          <LinkPreview
            key={link.url}
            link={link}
            onRemove={onRemove ? () => onRemove(i) : undefined}
          />
        ))}
      </AnimatePresence>
      {overflow > 0 && (
        <div style={{ fontSize: 11, color: C.t4, textAlign: "center" }}>
          +{overflow} more links
        </div>
      )}
    </div>
  );
}
