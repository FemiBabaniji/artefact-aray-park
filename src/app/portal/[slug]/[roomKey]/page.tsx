"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import type { EngagementRoom, EngagementBlock } from "@/types/engagement";

export default function ClientRoomPage({
  params,
}: {
  params: Promise<{ slug: string; roomKey: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const C = useC();
  const [room, setRoom] = useState<EngagementRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(
          `/api/portal/${resolvedParams.slug}/rooms/${resolvedParams.roomKey}`
        );
        if (!res.ok) {
          if (res.status === 404) {
            setError("Room not found");
          } else if (res.status === 403) {
            setError("Access denied");
          } else {
            setError("Failed to load room");
          }
          return;
        }
        const data = await res.json();
        setRoom(data.room);
      } catch (err) {
        setError("Failed to load room");
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();
  }, [resolvedParams.slug, resolvedParams.roomKey]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: C.void,
          color: C.t3,
        }}
      >
        Loading...
      </div>
    );
  }

  if (error || !room) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: C.void,
          color: C.t3,
          gap: 16,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 500, color: C.t1 }}>
          {error || "Not found"}
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push(`/portal/${resolvedParams.slug}`)}
          style={{
            padding: "8px 16px",
            background: C.bg,
            border: `1px solid ${C.sep}`,
            borderRadius: 6,
            color: C.t2,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Back to project
        </motion.button>
      </div>
    );
  }

  const canEdit = room.visibility === "client_edit";
  const blocks = room.blocks || [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.void,
        color: C.t1,
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: `1px solid ${C.sep}`,
          background: C.bg,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "16px 32px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/portal/${resolvedParams.slug}`)}
            style={{
              padding: "6px 12px",
              background: "transparent",
              border: `1px solid ${C.sep}`,
              borderRadius: 6,
              color: C.t2,
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </motion.button>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{room.label}</div>
          </div>

          {canEdit && (
            <span
              style={{
                padding: "4px 10px",
                background: `${C.green}20`,
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 500,
                color: C.green,
              }}
            >
              You can edit
            </span>
          )}
        </div>
      </div>

      {/* Room prompt */}
      {room.prompt && (
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "24px 32px 0",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              background: `${C.blue}10`,
              borderRadius: 8,
              fontSize: 13,
              color: C.t2,
              lineHeight: 1.5,
            }}
          >
            {room.prompt}
          </div>
        </div>
      )}

      {/* Blocks */}
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "24px 32px 64px",
        }}
      >
        {blocks.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: C.t3,
              background: C.bg,
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 14, marginBottom: 8 }}>No content yet</div>
            <div style={{ fontSize: 13, color: C.t4 }}>
              {canEdit
                ? "Add your first item to this room."
                : "Your consultant will add content soon."}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} C={C} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockRenderer({
  block,
  C,
}: {
  block: EngagementBlock;
  C: Record<string, string>;
}) {
  switch (block.blockType) {
    case "text":
      return (
        <div
          style={{
            padding: "20px 24px",
            background: C.bg,
            borderRadius: 10,
          }}
        >
          <div
            style={{ fontSize: 14, lineHeight: 1.6, color: C.t1 }}
            dangerouslySetInnerHTML={{ __html: block.content || "" }}
          />
          {block.caption && (
            <div style={{ fontSize: 12, color: C.t3, marginTop: 8 }}>
              {block.caption}
            </div>
          )}
        </div>
      );

    case "image":
      return (
        <div
          style={{
            background: C.bg,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {block.storagePath && (
            <img
              src={block.storagePath}
              alt={block.caption || ""}
              style={{ width: "100%", display: "block" }}
            />
          )}
          {block.caption && (
            <div style={{ padding: "12px 16px", fontSize: 12, color: C.t3 }}>
              {block.caption}
            </div>
          )}
        </div>
      );

    case "document":
      return (
        <div
          style={{
            padding: "16px 20px",
            background: C.bg,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: C.void,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                stroke={C.t3}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 2V8H20"
                stroke={C.t3}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {block.caption || "Document"}
            </div>
            {block.content && (
              <div style={{ fontSize: 12, color: C.t3 }}>{block.content}</div>
            )}
          </div>
          {block.storagePath && (
            <motion.a
              href={block.storagePath}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ background: C.void }}
              style={{
                padding: "6px 12px",
                background: C.void,
                borderRadius: 6,
                fontSize: 12,
                color: C.blue,
                textDecoration: "none",
              }}
            >
              Download
            </motion.a>
          )}
        </div>
      );

    case "link":
      return (
        <motion.a
          href={block.content || "#"}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ borderColor: C.blue }}
          style={{
            display: "block",
            padding: "16px 20px",
            background: C.bg,
            border: `1px solid ${C.sep}`,
            borderRadius: 10,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 500, color: C.blue }}>
            {block.caption || block.content}
          </div>
          {block.content && block.caption && (
            <div
              style={{
                fontSize: 12,
                color: C.t3,
                marginTop: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {block.content}
            </div>
          )}
        </motion.a>
      );

    default:
      return (
        <div
          style={{
            padding: "16px 20px",
            background: C.bg,
            borderRadius: 10,
          }}
        >
          <div style={{ fontSize: 12, color: C.t4 }}>
            {block.blockType}: {block.content || "(no content)"}
          </div>
        </div>
      );
  }
}
