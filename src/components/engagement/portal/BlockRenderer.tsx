"use client";

import type { ReactNode } from "react";
import { useC } from "@/hooks/useC";
import type { EngagementBlock } from "@/types/engagement";

type BlockRendererProps = {
  block: EngagementBlock;
  isNew?: boolean;
};

export function BlockRenderer({ block, isNew }: BlockRendererProps) {
  const C = useC();

  // NEW badge component
  const NewBadge = (): ReactNode =>
    isNew ? (
      <span
        style={{
          padding: "2px 8px",
          background: C.amber,
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 600,
          color: "#fff",
          textTransform: "uppercase",
          letterSpacing: ".04em",
        }}
      >
        New
      </span>
    ) : null;

  // Format date helper
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Wrapper styles
  const wrapperStyle: React.CSSProperties = {
    background: C.bg,
    border: `1px solid ${isNew ? C.blue : C.sep}`,
    borderRadius: 12,
    overflow: "hidden",
  };

  switch (block.blockType) {
    case "decision":
      return <DecisionBlockRenderer block={block} NewBadge={NewBadge} C={C} formatDate={formatDate} wrapperStyle={wrapperStyle} />;
    case "file":
      return <FileBlockRenderer block={block} NewBadge={NewBadge} C={C} formatFileSize={formatFileSize} wrapperStyle={wrapperStyle} />;
    case "outcome":
      return <OutcomeBlockRenderer block={block} NewBadge={NewBadge} C={C} wrapperStyle={wrapperStyle} />;
    default:
      return <TextBlockRenderer block={block} NewBadge={NewBadge} C={C} wrapperStyle={wrapperStyle} />;
  }
}

// ── Decision Block ─────────────────────────────────────────────────────────────

function DecisionBlockRenderer({
  block,
  NewBadge,
  C,
  formatDate,
  wrapperStyle,
}: {
  block: EngagementBlock;
  NewBadge: () => ReactNode;
  C: ReturnType<typeof useC>;
  formatDate: (d: string) => string;
  wrapperStyle: React.CSSProperties;
}) {
  const meta = block.metadata as {
    title?: string;
    rationale?: string;
    attendees?: string[];
    decidedAt?: string;
  } | undefined;

  return (
    <div style={wrapperStyle}>
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Decision icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: `${C.green}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17L4 12"
              stroke={C.green}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div style={{ flex: 1 }}>
          {meta?.decidedAt && (
            <div style={{ fontSize: 11, color: C.t4, marginBottom: 2 }}>
              {formatDate(meta.decidedAt)}
            </div>
          )}
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {meta?.title || "Decision"}
          </div>
        </div>

        <NewBadge />
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px" }}>
        {/* Decision text */}
        {block.content && (
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: C.t1,
              marginBottom: meta?.rationale ? 16 : 0,
            }}
          >
            {block.content}
          </div>
        )}

        {/* Rationale */}
        {meta?.rationale && (
          <div
            style={{
              padding: "12px 16px",
              background: C.void,
              borderRadius: 8,
              marginBottom: meta?.attendees?.length ? 16 : 0,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: C.t4,
                textTransform: "uppercase",
                letterSpacing: ".06em",
                marginBottom: 6,
              }}
            >
              Rationale
            </div>
            <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.5 }}>
              {meta.rationale}
            </div>
          </div>
        )}

        {/* Attendees */}
        {meta?.attendees && meta.attendees.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: C.t4 }}>Present:</span>
            <div style={{ display: "flex", gap: 6 }}>
              {meta.attendees.map((name, i) => (
                <span
                  key={i}
                  style={{
                    padding: "3px 10px",
                    background: C.void,
                    borderRadius: 12,
                    fontSize: 12,
                    color: C.t2,
                  }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── File Block ─────────────────────────────────────────────────────────────────

function FileBlockRenderer({
  block,
  NewBadge,
  C,
  formatFileSize,
  wrapperStyle,
}: {
  block: EngagementBlock;
  NewBadge: () => ReactNode;
  C: ReturnType<typeof useC>;
  formatFileSize: (b: number) => string;
  wrapperStyle: React.CSSProperties;
}) {
  const meta = block.metadata as {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  } | undefined;

  const fileName = meta?.fileName || block.storagePath?.split("/").pop() || "File";
  const fileSize = meta?.fileSize;
  const mimeType = meta?.mimeType || "";

  // Get file icon based on mime type
  const getFileIcon = () => {
    if (mimeType.includes("pdf")) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C5 2 4 3 4 4V20C4 21 5 22 6 22H18C19 22 20 21 20 20V8L14 2Z" stroke={C.amber} strokeWidth="2" />
          <path d="M14 2V8H20" stroke={C.amber} strokeWidth="2" />
          <path d="M9 13H15M9 17H12" stroke={C.amber} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    if (mimeType.includes("image")) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke={C.blue} strokeWidth="2" />
          <circle cx="8.5" cy="8.5" r="1.5" fill={C.blue} />
          <path d="M21 15L16 10L5 21" stroke={C.blue} strokeWidth="2" />
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6C5 2 4 3 4 4V20C4 21 5 22 6 22H18C19 22 20 21 20 20V8L14 2Z" stroke={C.t3} strokeWidth="2" />
        <path d="M14 2V8H20" stroke={C.t3} strokeWidth="2" />
      </svg>
    );
  };

  return (
    <div style={wrapperStyle}>
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* File icon */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            background: C.void,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {getFileIcon()}
        </div>

        {/* File info */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            {fileName}
          </div>
          <div style={{ fontSize: 12, color: C.t4 }}>
            {fileSize ? formatFileSize(fileSize) : "File"}
          </div>
        </div>

        <NewBadge />

        {/* Download button */}
        {block.storagePath && (
          <a
            href={block.storagePath}
            download
            style={{
              padding: "8px 16px",
              background: C.blue,
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              color: "#fff",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 15V19C21 20 20 21 19 21H5C4 21 3 20 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Download
          </a>
        )}
      </div>

      {/* Caption */}
      {block.caption && (
        <div
          style={{
            padding: "12px 20px",
            borderTop: `1px solid ${C.sep}`,
            fontSize: 13,
            color: C.t3,
            lineHeight: 1.5,
          }}
        >
          {block.caption}
        </div>
      )}
    </div>
  );
}

// ── Outcome Block ──────────────────────────────────────────────────────────────

function OutcomeBlockRenderer({
  block,
  NewBadge,
  C,
  wrapperStyle,
}: {
  block: EngagementBlock;
  NewBadge: () => ReactNode;
  C: ReturnType<typeof useC>;
  wrapperStyle: React.CSSProperties;
}) {
  const meta = block.metadata as {
    metric?: string;
    value?: string | number;
  } | undefined;

  return (
    <div style={wrapperStyle}>
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        {/* Outcome icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: `${C.blue}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22 12H18L15 21L9 3L6 12H2" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div style={{ flex: 1 }}>
          {/* Content */}
          {block.content && (
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: C.t1,
              }}
            >
              {block.content}
            </div>
          )}

          {/* Metric highlight */}
          {meta?.metric && meta?.value && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 16px",
                background: `${C.blue}10`,
                borderRadius: 8,
                display: "inline-flex",
                alignItems: "baseline",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 24, fontWeight: 700, color: C.blue }}>
                {meta.value}
              </span>
              <span style={{ fontSize: 13, color: C.t2 }}>{meta.metric}</span>
            </div>
          )}
        </div>

        <NewBadge />
      </div>
    </div>
  );
}

// ── Text Block ─────────────────────────────────────────────────────────────────

function TextBlockRenderer({
  block,
  NewBadge,
  C,
  wrapperStyle,
}: {
  block: EngagementBlock;
  NewBadge: () => ReactNode;
  C: ReturnType<typeof useC>;
  wrapperStyle: React.CSSProperties;
}) {
  return (
    <div style={wrapperStyle}>
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          {block.content && (
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: C.t1,
                whiteSpace: "pre-wrap",
              }}
            >
              {block.content}
            </div>
          )}
        </div>
        <NewBadge />
      </div>

      {/* Caption */}
      {block.caption && (
        <div
          style={{
            padding: "12px 20px",
            borderTop: `1px solid ${C.sep}`,
            fontSize: 12,
            color: C.t4,
            fontStyle: "italic",
          }}
        >
          {block.caption}
        </div>
      )}
    </div>
  );
}
