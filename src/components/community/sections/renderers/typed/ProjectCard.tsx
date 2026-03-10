"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import type { Block } from "@/types/room";
import type { ProjectBlockContent } from "@/types/structured-blocks";

type ProjectCardProps = {
  block: Block;
  accent?: string;
  layoutId?: string;
};

export function ProjectCard({ block, accent, layoutId }: ProjectCardProps) {
  const C = useC();

  // Extract project data from block.metadata
  const data = (block.metadata as ProjectBlockContent) || {};
  const title = data.title ?? block.content ?? "Untitled Project";
  const description = data.description ?? block.caption;
  const role = data.role;
  const url = data.url;
  const image = data.image ?? block.storagePath;
  const status = data.status ?? "in_progress";
  const skills = data.skills ?? [];
  const highlights = data.highlights ?? [];

  const statusColors: Record<string, { bg: string; text: string }> = {
    completed: { bg: `${C.green}15`, text: C.green },
    in_progress: { bg: `${C.blue}15`, text: C.blue },
    planned: { bg: `${C.t4}15`, text: C.t3 },
  };

  const statusStyle = statusColors[status] || statusColors.in_progress;

  const CardContent = (
    <motion.div
      layoutId={layoutId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPF}
      whileHover={url ? { y: -2 } : undefined}
      style={{
        background: C.bg,
        borderRadius: 12,
        border: `1px solid ${C.sep}`,
        overflow: "hidden",
        cursor: url ? "pointer" : "default",
        transition: "box-shadow 0.15s",
      }}
    >
      {/* Image */}
      {image && (
        <div
          style={{
            width: "100%",
            height: 160,
            background: C.edge,
            overflow: "hidden",
          }}
        >
          <img
            src={image}
            alt={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: 20 }}>
        {/* Header: Title + Status */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 8,
          }}
        >
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

          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              color: statusStyle.text,
              background: statusStyle.bg,
              padding: "3px 8px",
              borderRadius: 4,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {status.replace("_", " ")}
          </span>
        </div>

        {/* Role */}
        {role && (
          <div
            style={{
              fontSize: 12,
              color: accent || C.t3,
              marginBottom: 8,
            }}
          >
            {role}
          </div>
        )}

        {/* Description */}
        {description && (
          <p
            style={{
              fontSize: 13,
              color: C.t2,
              lineHeight: 1.5,
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
            {highlights.slice(0, 3).map((h, i) => (
              <li
                key={i}
                style={{
                  fontSize: 12,
                  color: C.t2,
                  lineHeight: 1.5,
                  marginBottom: 2,
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
            {skills.slice(0, 4).map((skill, i) => (
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
            {skills.length > 4 && (
              <span
                style={{
                  fontSize: 10,
                  color: C.t4,
                }}
              >
                +{skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", display: "block" }}
      >
        {CardContent}
      </a>
    );
  }

  return CardContent;
}
