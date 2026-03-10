"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { Block } from "@/types/room";
import type { ExperienceBlockContent } from "@/types/structured-blocks";

type ExperienceItemProps = {
  block: Block;
  accent?: string;
  layoutId?: string;
};

export function ExperienceItem({ block, accent, layoutId }: ExperienceItemProps) {
  const C = useC();

  // Extract experience data from block.metadata
  const data = (block.metadata as ExperienceBlockContent) || {};
  const title = data.title ?? block.content ?? "Role";
  const organization = data.organization ?? "";
  const location = data.location;
  const startDate = data.startDate;
  const endDate = data.endDate;
  const current = data.current;
  const description = data.description ?? block.caption;
  const highlights = data.highlights ?? [];
  const skills = data.skills ?? [];

  // Format date range
  const dateRange = formatDateRange(startDate, endDate, current);

  return (
    <motion.div
      layoutId={layoutId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPF}
      style={{
        padding: "20px 24px",
        background: C.bg,
        borderRadius: 12,
        border: `1px solid ${C.sep}`,
        borderLeft: `3px solid ${accent || C.t3}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 8,
        }}
      >
        <div>
          {/* Title */}
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: C.t1,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {title}
          </h3>

          {/* Organization */}
          {organization && (
            <div
              style={{
                fontSize: 14,
                color: accent || C.t2,
                marginTop: 2,
              }}
            >
              {organization}
              {location && (
                <span style={{ color: C.t3 }}> &middot; {location}</span>
              )}
            </div>
          )}
        </div>

        {/* Date range */}
        {dateRange && (
          <div
            style={{
              fontSize: 11,
              color: C.t3,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {dateRange}
            {current && (
              <span
                style={{
                  display: "block",
                  fontSize: 9,
                  color: C.green,
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                Current
              </span>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p
          style={{
            fontSize: 13,
            color: C.t2,
            lineHeight: 1.6,
            margin: 0,
            marginBottom: highlights.length > 0 || skills.length > 0 ? 12 : 0,
          }}
        >
          {description}
        </p>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <ul
          style={{
            margin: 0,
            padding: "0 0 0 16px",
            marginBottom: skills.length > 0 ? 12 : 0,
          }}
        >
          {highlights.map((h, i) => (
            <li
              key={i}
              style={{
                fontSize: 12,
                color: C.t2,
                lineHeight: 1.5,
                marginBottom: 4,
              }}
            >
              {h}
            </li>
          ))}
        </ul>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {skills.map((skill, i) => (
            <span
              key={i}
              style={{
                fontSize: 10,
                color: C.t3,
                background: C.edge,
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function formatDateRange(start?: string, end?: string, current?: boolean): string {
  if (!start) return "";

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const startFormatted = formatDate(start);

  if (current) {
    return `${startFormatted} - Present`;
  }

  if (end) {
    return `${startFormatted} - ${formatDate(end)}`;
  }

  return startFormatted;
}
