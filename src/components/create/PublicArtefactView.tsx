"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE, SPF } from "@/lib/motion";
import { inferTemplateFromRoom, shouldRenderHeroBand } from "@/components/community/sections/templates";
import { MetricCard, MilestoneEntry, ProjectCard, SkillBadge, ExperienceItem } from "@/components/community/sections/renderers/typed";
import type { StandaloneArtefact, StandaloneRoom, Identity } from "@/types/artefact";
import type { Block } from "@/types/room";

type PublicArtefactViewProps = {
  artefact: StandaloneArtefact;
  communityName?: string;
  accent?: string;
};

export function PublicArtefactView({ artefact, communityName, accent }: PublicArtefactViewProps) {
  const C = useC();
  const { identity, rooms } = artefact;
  const accentColor = accent || C.blue;

  // Only show public rooms with content
  const publicRooms = rooms.filter((r) => r.visibility === "public" && r.blocks.length > 0);

  // Check if first room should be rendered as hero band
  const hasIdentityHero = identity.name || identity.title || identity.bio;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.void,
        overflow: "hidden",
      }}
    >
      {/* Hero Band - Full-width identity header */}
      {hasIdentityHero && (
        <HeroBand
          identity={identity}
          communityName={communityName}
          accent={accentColor}
        />
      )}

      {/* Content container */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        {/* Rooms with section separators */}
        {publicRooms.map((room, idx) => (
          <RoomSection
            key={room.id}
            room={room}
            index={idx}
            accent={accentColor}
            isFirst={idx === 0}
          />
        ))}

        {/* Footer */}
        <footer
          style={{
            marginTop: 80,
            paddingTop: 24,
            paddingBottom: 48,
            borderTop: `1px solid ${C.sep}`,
            fontSize: 10,
            color: C.t4,
            textAlign: "center",
          }}
        >
          Built with Artefact
        </footer>
      </div>
    </div>
  );
}

// ── Hero Band ─────────────────────────────────────────────────────────────────

function HeroBand({
  identity,
  communityName,
  accent,
}: {
  identity: Identity;
  communityName?: string;
  accent: string;
}) {
  const C = useC();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPF}
      style={{
        width: "100%",
        padding: "120px 24px",
        textAlign: "center",
        borderBottom: `1px solid ${C.sep}`,
        background: C.void,
      }}
    >
      {/* Content container */}
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Community badge */}
        {communityName && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPF, delay: 0.05 }}
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: C.t4,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            {communityName} Artefact
          </motion.div>
        )}

        {/* Avatar */}
        {identity.avatar && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...SPF, delay: 0.1 }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 20,
              backgroundColor: accent,
              overflow: "hidden",
              marginBottom: 8,
            }}
          >
            <img
              src={identity.avatar}
              alt={identity.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </motion.div>
        )}

        {/* Name */}
        {identity.name && (
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPF, delay: 0.15 }}
            style={{
              fontSize: 40,
              fontWeight: 600,
              color: C.t1,
              margin: 0,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {identity.name}
          </motion.h1>
        )}

        {/* Title */}
        {identity.title && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPF, delay: 0.2 }}
            style={{
              fontSize: 16,
              color: C.t2,
              margin: 0,
            }}
          >
            {identity.title}
          </motion.p>
        )}

        {/* Bio */}
        {identity.bio && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPF, delay: 0.25 }}
            style={{
              fontSize: 18,
              color: C.t2,
              margin: "8px 0 0 0",
              maxWidth: 600,
              lineHeight: 1.6,
            }}
          >
            {identity.bio}
          </motion.p>
        )}

        {/* Links */}
        {identity.links.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPF, delay: 0.3 }}
            style={{
              display: "flex",
              gap: 12,
              marginTop: 24,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {identity.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.t2,
                  background: C.edge,
                  borderRadius: 20,
                  textDecoration: "none",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = accent;
                  e.currentTarget.style.color = C.void;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = C.edge;
                  e.currentTarget.style.color = C.t2;
                }}
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ── Room Section ─────────────────────────────────────────────────────────────

function RoomSection({
  room,
  index,
  accent,
  isFirst,
}: {
  room: StandaloneRoom;
  index: number;
  accent: string;
  isFirst: boolean;
}) {
  const C = useC();
  const template = inferTemplateFromRoom(room);

  // Group blocks by type for better rendering
  const metricBlocks = room.blocks.filter((b) => b.blockType === "metric");
  const milestoneBlocks = room.blocks.filter((b) => b.blockType === "milestone");
  const projectBlocks = room.blocks.filter((b) => b.blockType === "project");
  const skillBlocks = room.blocks.filter((b) => b.blockType === "skill");
  const experienceBlocks = room.blocks.filter((b) => b.blockType === "experience");
  const otherBlocks = room.blocks.filter(
    (b) => !["metric", "milestone", "project", "skill", "experience"].includes(b.blockType)
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...FADE, delay: index * 0.05 }}
    >
      {/* Section separator with label */}
      <div
        style={{
          marginTop: isFirst ? 48 : 80,
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
          {room.label}
        </div>
        <div
          style={{
            height: 1,
            backgroundColor: C.sep,
          }}
        />
      </div>

      {/* Metrics grid */}
      {metricBlocks.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            marginBottom: otherBlocks.length > 0 || projectBlocks.length > 0 ? 32 : 0,
          }}
        >
          {metricBlocks.map((block) => (
            <MetricCard key={block.id} block={block} accent={accent} />
          ))}
        </div>
      )}

      {/* Timeline (milestones) */}
      {milestoneBlocks.length > 0 && (
        <div
          style={{
            marginBottom: otherBlocks.length > 0 ? 32 : 0,
          }}
        >
          {milestoneBlocks.map((block, i) => (
            <MilestoneEntry
              key={block.id}
              block={block}
              accent={accent}
              isFirst={i === 0}
              isLast={i === milestoneBlocks.length - 1}
            />
          ))}
        </div>
      )}

      {/* Projects grid */}
      {projectBlocks.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            marginBottom: otherBlocks.length > 0 ? 32 : 0,
          }}
        >
          {projectBlocks.map((block) => (
            <ProjectCard key={block.id} block={block} accent={accent} />
          ))}
        </div>
      )}

      {/* Skills */}
      {skillBlocks.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: otherBlocks.length > 0 ? 32 : 0,
          }}
        >
          {skillBlocks.map((block) => (
            <SkillBadge key={block.id} block={block} accent={accent} />
          ))}
        </div>
      )}

      {/* Experience */}
      {experienceBlocks.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginBottom: otherBlocks.length > 0 ? 32 : 0,
          }}
        >
          {experienceBlocks.map((block) => (
            <ExperienceItem key={block.id} block={block} accent={accent} />
          ))}
        </div>
      )}

      {/* Other blocks (text, image, link, embed, etc.) */}
      {otherBlocks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {otherBlocks.map((block) => (
            <BlockView key={block.id} block={block} accent={accent} />
          ))}
        </div>
      )}
    </motion.section>
  );
}

// ── Block View ───────────────────────────────────────────────────────────────

function BlockView({ block, accent }: { block: Block; accent: string }) {
  const C = useC();

  switch (block.blockType) {
    case "text":
      return (
        <div
          style={{
            fontSize: 15,
            color: C.t1,
            lineHeight: 1.7,
          }}
          dangerouslySetInnerHTML={{ __html: block.content || "" }}
        />
      );

    case "image":
      return (
        <div>
          {(block.storagePath || block.content) && (
            <img
              src={block.storagePath || block.content}
              alt={block.caption || ""}
              style={{
                maxWidth: "100%",
                borderRadius: 12,
              }}
            />
          )}
          {block.caption && (
            <div
              style={{
                fontSize: 12,
                color: C.t3,
                marginTop: 8,
              }}
            >
              {block.caption}
            </div>
          )}
        </div>
      );

    case "link":
      const meta = block.metadata;
      return (
        <a
          href={block.content}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            border: `1px solid ${C.sep}`,
            borderRadius: 12,
            padding: 16,
            textDecoration: "none",
            transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.sep;
          }}
        >
          {meta?.ogImage && (
            <img
              src={meta.ogImage}
              alt=""
              style={{
                width: "100%",
                height: 180,
                objectFit: "cover",
                borderRadius: 8,
                marginBottom: 12,
              }}
            />
          )}
          <div style={{ fontSize: 15, fontWeight: 500, color: C.t1 }}>
            {meta?.ogTitle || block.content}
          </div>
          {meta?.ogDescription && (
            <div
              style={{
                fontSize: 13,
                color: C.t3,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              {meta.ogDescription}
            </div>
          )}
          <div style={{ fontSize: 11, color: C.t4, marginTop: 8 }}>
            {meta?.ogSiteName || safeHostname(block.content)}
          </div>
        </a>
      );

    case "embed":
      const url = block.content || "";
      const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
      const isVimeo = url.includes("vimeo.com");

      if (isYouTube) {
        const videoId = url.includes("youtu.be")
          ? url.split("/").pop()
          : new URLSearchParams(new URL(url).search).get("v");
        return (
          <div
            style={{
              position: "relative",
              paddingBottom: "56.25%",
              height: 0,
              overflow: "hidden",
              borderRadius: 12,
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }

      if (isVimeo) {
        const videoId = url.split("/").pop();
        return (
          <div
            style={{
              position: "relative",
              paddingBottom: "56.25%",
              height: 0,
              overflow: "hidden",
              borderRadius: 12,
            }}
          >
            <iframe
              src={`https://player.vimeo.com/video/${videoId}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }

      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 14, color: accent }}
        >
          {url}
        </a>
      );

    case "document":
      const docMeta = block.metadata as { filename?: string; thumbnailUrl?: string } | undefined;
      return (
        <a
          href={block.content || block.storagePath}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 16,
            border: `1px solid ${C.sep}`,
            borderRadius: 12,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: C.edge,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: C.t3,
            }}
          >
            {docMeta?.thumbnailUrl ? (
              <img src={docMeta.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
            ) : (
              "\u25A4"
            )}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.t1 }}>
              {docMeta?.filename || block.caption || "Document"}
            </div>
            <div style={{ fontSize: 11, color: C.t4 }}>View document</div>
          </div>
        </a>
      );

    case "education":
      const eduData = block.metadata as { institution?: string; degree?: string; field?: string; endDate?: string } | undefined;
      return (
        <div
          style={{
            padding: 16,
            background: C.bg,
            borderRadius: 12,
            border: `1px solid ${C.sep}`,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 500, color: C.t1 }}>
            {eduData?.degree || block.content}
          </div>
          {eduData?.institution && (
            <div style={{ fontSize: 13, color: accent, marginTop: 4 }}>
              {eduData.institution}
              {eduData.field && ` - ${eduData.field}`}
            </div>
          )}
          {eduData?.endDate && (
            <div style={{ fontSize: 11, color: C.t4, marginTop: 4 }}>
              {eduData.endDate}
            </div>
          )}
        </div>
      );

    case "certification":
      const certData = block.metadata as { name?: string; issuer?: string; date?: string; url?: string } | undefined;
      const CertContent = (
        <div
          style={{
            padding: 16,
            background: C.bg,
            borderRadius: 12,
            border: `1px solid ${C.sep}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `${accent}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: accent,
            }}
          >
            {"\u2713"}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.t1 }}>
              {certData?.name || block.content}
            </div>
            {certData?.issuer && (
              <div style={{ fontSize: 12, color: C.t3 }}>
                {certData.issuer}
                {certData.date && ` - ${certData.date}`}
              </div>
            )}
          </div>
        </div>
      );

      if (certData?.url) {
        return (
          <a href={certData.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            {CertContent}
          </a>
        );
      }
      return CertContent;

    case "relationship":
      const relData = block.metadata as { personName?: string; personTitle?: string; relationship?: string; avatar?: string } | undefined;
      return (
        <div
          style={{
            padding: 16,
            background: C.bg,
            borderRadius: 12,
            border: `1px solid ${C.sep}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
              color: "rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}
          >
            {relData?.avatar ? (
              <img src={relData.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              (relData?.personName || "?").charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.t1 }}>
              {relData?.personName || block.content}
            </div>
            {relData?.personTitle && (
              <div style={{ fontSize: 12, color: C.t3 }}>{relData.personTitle}</div>
            )}
            {relData?.relationship && (
              <div style={{ fontSize: 11, color: accent, marginTop: 2 }}>
                {relData.relationship}
              </div>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
}

// Helper to safely extract hostname
function safeHostname(url: string | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
