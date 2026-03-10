"use client";

import { useC } from "@/hooks/useC";
import type { DocumentBlockContent } from "@/types/structured-blocks";

interface DocumentBlockProps {
  content: DocumentBlockContent;
  compact?: boolean;
}

export function DocumentBlock({ content, compact = false }: DocumentBlockProps) {
  const C = useC();

  if (compact) {
    return (
      <a
        href={content.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: C.void,
          border: `1px solid ${C.edge}`,
          borderRadius: 8,
          textDecoration: "none",
          color: C.t1,
          fontSize: 12,
        }}
      >
        <span style={{ fontSize: 16 }}>&#x25A4;</span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {content.filename}
        </span>
        {content.pageCount && (
          <span style={{ color: C.t4, fontSize: 10 }}>
            {content.pageCount} pg
          </span>
        )}
      </a>
    );
  }

  return (
    <div
      style={{
        border: `1px solid ${C.edge}`,
        borderRadius: 12,
        overflow: "hidden",
        background: C.void,
      }}
    >
      {/* Thumbnail or placeholder */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: C.edge + "30",
          minHeight: 120,
        }}
      >
        {content.thumbnailUrl ? (
          <img
            src={content.thumbnailUrl}
            alt={content.filename}
            style={{
              maxWidth: "100%",
              maxHeight: 200,
              objectFit: "contain",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: 24,
              color: C.t4,
            }}
          >
            <span style={{ fontSize: 32 }}>&#x25A4;</span>
            <span style={{ fontSize: 11 }}>PDF Document</span>
          </div>
        )}
      </div>

      {/* Info bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderTop: `1px solid ${C.edge}`,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 500,
              color: C.t1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {content.filename}
          </p>
          {content.pageCount && (
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 11,
                color: C.t4,
              }}
            >
              {content.pageCount} {content.pageCount === 1 ? "page" : "pages"}
            </p>
          )}
        </div>
        <a
          href={content.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "6px 12px",
            fontSize: 11,
            color: C.blue,
            background: C.blue + "15",
            border: "none",
            borderRadius: 6,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          View PDF &#x2197;
        </a>
      </div>
    </div>
  );
}
