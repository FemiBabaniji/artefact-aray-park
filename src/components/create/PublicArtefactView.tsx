"use client";

import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE } from "@/lib/motion";
import type { StandaloneArtefact, StandaloneRoom } from "@/types/artefact";
import type { Block } from "@/types/room";

type PublicArtefactViewProps = {
  artefact: StandaloneArtefact;
};

export function PublicArtefactView({ artefact }: PublicArtefactViewProps) {
  const C = useC();
  const { identity, rooms } = artefact;

  // Only show public rooms
  const publicRooms = rooms.filter((r) => r.visibility === "public" && r.blocks.length > 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.void,
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Identity Header */}
        <motion.header
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={FADE}
          style={{ marginBottom: 48 }}
        >
          {identity.avatar && (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <img
                src={identity.avatar}
                alt={identity.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}

          {identity.name && (
            <h1
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: C.t1,
                marginBottom: 4,
                letterSpacing: "-0.02em",
              }}
            >
              {identity.name}
            </h1>
          )}

          {identity.title && (
            <div style={{ fontSize: 14, color: C.t2, marginBottom: 8 }}>
              {identity.title}
            </div>
          )}

          {identity.location && (
            <div style={{ fontSize: 12, color: C.t3, marginBottom: 12 }}>
              {identity.location}
            </div>
          )}

          {identity.bio && (
            <p
              style={{
                fontSize: 14,
                color: C.t2,
                lineHeight: 1.6,
                maxWidth: 540,
              }}
            >
              {identity.bio}
            </p>
          )}

          {identity.links.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 16,
                flexWrap: "wrap",
              }}
            >
              {identity.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: C.blue,
                    textDecoration: "none",
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </motion.header>

        {/* Rooms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
          {publicRooms.map((room, idx) => (
            <RoomSection key={room.id} room={room} index={idx} />
          ))}
        </div>

        {/* Footer */}
        <footer
          style={{
            marginTop: 64,
            paddingTop: 24,
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

// ── Room Section ─────────────────────────────────────────────────────────────

function RoomSection({ room, index }: { room: StandaloneRoom; index: number }) {
  const C = useC();

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...FADE, delay: index * 0.05 }}
    >
      <h2
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: C.t3,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 16,
        }}
      >
        {room.label}
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {room.blocks.map((block) => (
          <BlockView key={block.id} block={block} />
        ))}
      </div>
    </motion.section>
  );
}

// ── Block View ───────────────────────────────────────────────────────────────

function BlockView({ block }: { block: Block }) {
  const C = useC();

  switch (block.blockType) {
    case "text":
      return (
        <div
          style={{
            fontSize: 14,
            color: C.t1,
            lineHeight: 1.7,
          }}
          dangerouslySetInnerHTML={{ __html: block.content || "" }}
        />
      );

    case "image":
      return (
        <div>
          {block.storagePath || block.content ? (
            <img
              src={block.storagePath || block.content}
              alt={block.caption || ""}
              style={{
                maxWidth: "100%",
                borderRadius: 8,
              }}
            />
          ) : null}
          {block.caption && (
            <div
              style={{
                fontSize: 11,
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
            border: `1px solid ${C.edge}`,
            borderRadius: 8,
            padding: 12,
            textDecoration: "none",
          }}
        >
          {meta?.ogImage && (
            <img
              src={meta.ogImage}
              alt=""
              style={{
                width: "100%",
                height: 160,
                objectFit: "cover",
                borderRadius: 6,
                marginBottom: 12,
              }}
            />
          )}
          <div style={{ fontSize: 14, fontWeight: 500, color: C.t1 }}>
            {meta?.ogTitle || block.content}
          </div>
          {meta?.ogDescription && (
            <div
              style={{
                fontSize: 12,
                color: C.t3,
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              {meta.ogDescription}
            </div>
          )}
          <div style={{ fontSize: 10, color: C.t4, marginTop: 8 }}>
            {meta?.ogSiteName || new URL(block.content || "").hostname}
          </div>
        </a>
      );

    case "embed":
      // Simple embed handling for YouTube, Vimeo, etc.
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
              borderRadius: 8,
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
              borderRadius: 8,
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

      // Generic link fallback
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, color: C.blue }}
        >
          {url}
        </a>
      );

    default:
      return null;
  }
}
