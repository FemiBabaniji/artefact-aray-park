"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { useC } from "@/hooks/useC";
import { Btn } from "@/components/primitives/Btn";
import type { Block, BlockType } from "@/types/room";

const SP = { type: "spring", stiffness: 300, damping: 30 } as const;

type BlockComposerProps = {
  blocks: Block[];
  purpose?: string;
  onChange: (blocks: Block[]) => void;
  onSubmit?: () => void;
  readOnly?: boolean;
};

export function BlockComposer({
  blocks: propBlocks,
  purpose,
  onChange,
  onSubmit,
  readOnly = false,
}: BlockComposerProps) {
  const C = useC();

  // Local state to preserve newly added blocks before they have content
  const [localBlocks, setLocalBlocks] = useState<Block[]>(propBlocks);

  // Sync from props only on initial mount or when props change significantly
  // (e.g., different room loaded). We use a ref to track the initial prop state.
  const [initialPropIds] = useState(() => propBlocks.map(b => b.id).join(","));
  useEffect(() => {
    const currentPropIds = propBlocks.map(b => b.id).join(",");
    // If prop IDs changed (different data source), reset local state
    if (currentPropIds !== initialPropIds && propBlocks.length > 0) {
      setLocalBlocks(propBlocks);
    }
  }, [propBlocks, initialPropIds]);

  const blocks = localBlocks;

  const updateAndSync = useCallback(
    (newBlocks: Block[]) => {
      setLocalBlocks(newBlocks);
      onChange(newBlocks);
    },
    [onChange]
  );

  const addBlock = useCallback(
    (type: BlockType) => {
      const newBlock: Block = {
        id: `block_${Date.now()}`,
        blockType: type,
        content: "",
        orderIndex: blocks.length,
      };
      updateAndSync([...blocks, newBlock]);
    },
    [blocks, updateAndSync]
  );

  const updateBlock = useCallback(
    (id: string, updates: Partial<Block>) => {
      updateAndSync(
        blocks.map((b) => (b.id === id ? { ...b, ...updates } : b))
      );
    },
    [blocks, updateAndSync]
  );

  const deleteBlock = useCallback(
    (id: string) => {
      updateAndSync(blocks.filter((b) => b.id !== id));
    },
    [blocks, updateAndSync]
  );

  const handleReorder = useCallback(
    (reordered: Block[]) => {
      updateAndSync(reordered.map((b, i) => ({ ...b, orderIndex: i })));
    },
    [updateAndSync]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Purpose prompt */}
      {purpose && (
        <p style={{ fontSize: 12, color: C.t3, lineHeight: 1.5, margin: 0 }}>
          {purpose}
        </p>
      )}

      {/* Block list */}
      {blocks.length > 0 && (
        <Reorder.Group
          axis="y"
          values={blocks}
          onReorder={handleReorder}
          style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", padding: 0, margin: 0 }}
        >
          {blocks.map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              onUpdate={(updates) => updateBlock(block.id, updates)}
              onDelete={() => deleteBlock(block.id)}
              readOnly={readOnly}
            />
          ))}
        </Reorder.Group>
      )}

      {/* Add block affordances */}
      {!readOnly && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <AddBlockButton icon="T" label="Write" onClick={() => addBlock("text")} />
          <AddBlockButton icon="◫" label="Image" onClick={() => addBlock("image")} />
          <AddBlockButton icon="↗" label="Link" onClick={() => addBlock("link")} />
          <AddBlockButton icon="▶" label="Embed" onClick={() => addBlock("embed")} />
        </div>
      )}

      {/* Submit */}
      {!readOnly && blocks.length > 0 && onSubmit && (
        <Btn onClick={onSubmit} style={{ alignSelf: "flex-end", marginTop: 8 }}>
          Send for feedback →
        </Btn>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Block Item - renders based on type
// ─────────────────────────────────────────────────────────────────────────────

type BlockItemProps = {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
  readOnly: boolean;
};

function BlockItem({ block, onUpdate, onDelete, readOnly }: BlockItemProps) {
  const C = useC();

  return (
    <Reorder.Item
      value={block}
      style={{
        background: C.bg,
        border: `1px solid ${C.edge}`,
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start" }}>
        {/* Drag handle */}
        {!readOnly && (
          <div
            style={{
              padding: "10px 8px",
              cursor: "grab",
              color: C.t4,
              fontSize: 10,
              display: "flex",
              alignItems: "center",
            }}
          >
            ≡
          </div>
        )}

        {/* Content area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {block.blockType === "text" && (
            <BlockText block={block} onUpdate={onUpdate} readOnly={readOnly} />
          )}
          {block.blockType === "image" && (
            <BlockImage block={block} onUpdate={onUpdate} readOnly={readOnly} />
          )}
          {block.blockType === "link" && (
            <BlockLink block={block} onUpdate={onUpdate} readOnly={readOnly} />
          )}
          {block.blockType === "embed" && (
            <BlockEmbed block={block} onUpdate={onUpdate} readOnly={readOnly} />
          )}
        </div>

        {/* Delete */}
        {!readOnly && (
          <button
            onClick={onDelete}
            style={{
              padding: "10px 12px",
              fontSize: 12,
              color: C.t4,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        )}
      </div>
    </Reorder.Item>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Block type components
// ─────────────────────────────────────────────────────────────────────────────

function BlockText({
  block,
  onUpdate,
  readOnly,
}: {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  readOnly: boolean;
}) {
  const C = useC();

  if (readOnly) {
    return (
      <div
        style={{
          padding: "10px 12px",
          fontSize: 13,
          color: C.t2,
          lineHeight: 1.6,
        }}
        dangerouslySetInnerHTML={{ __html: block.content || "" }}
      />
    );
  }

  return (
    <textarea
      value={block.content || ""}
      onChange={(e) => onUpdate({ content: e.target.value })}
      placeholder="Write something..."
      style={{
        width: "100%",
        padding: "10px 12px",
        fontSize: 13,
        color: C.t1,
        background: "transparent",
        border: "none",
        outline: "none",
        resize: "vertical",
        minHeight: 60,
        lineHeight: 1.6,
      }}
    />
  );
}

function BlockImage({
  block,
  onUpdate,
  readOnly,
}: {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  readOnly: boolean;
}) {
  const C = useC();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    // TODO: Upload to storage and get URL
    // For now, create object URL as placeholder
    const url = URL.createObjectURL(file);
    onUpdate({ storagePath: url });
    setUploading(false);
  };

  if (block.storagePath) {
    return (
      <div style={{ padding: 8 }}>
        <img
          src={block.storagePath}
          alt={block.caption || ""}
          style={{
            width: "100%",
            maxHeight: 300,
            objectFit: "cover",
            borderRadius: 4,
          }}
        />
        {!readOnly && (
          <input
            type="text"
            value={block.caption || ""}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            placeholder="Add caption..."
            style={{
              width: "100%",
              marginTop: 6,
              padding: "6px 0",
              fontSize: 11,
              color: C.t3,
              background: "transparent",
              border: "none",
              outline: "none",
            }}
          />
        )}
        {readOnly && block.caption && (
          <p style={{ fontSize: 11, color: C.t3, margin: "6px 0 0" }}>
            {block.caption}
          </p>
        )}
      </div>
    );
  }

  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        color: C.t4,
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        style={{ display: "none" }}
      />
      {uploading ? "Uploading..." : "Click to upload image"}
    </label>
  );
}

function BlockLink({
  block,
  onUpdate,
  readOnly,
}: {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  readOnly: boolean;
}) {
  const C = useC();
  const [fetching, setFetching] = useState(false);

  const handleUrlChange = async (url: string) => {
    onUpdate({ content: url });

    if (url.startsWith("http")) {
      setFetching(true);
      try {
        const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const data = await res.json();
          onUpdate({
            content: url,
            metadata: {
              ogTitle: data.title,
              ogDescription: data.description,
              ogImage: data.image,
              ogSiteName: data.siteName,
            },
          });
        }
      } catch {
        // Ignore fetch errors
      }
      setFetching(false);
    }
  };

  const meta = block.metadata;

  if (meta?.ogTitle || meta?.ogImage) {
    return (
      <a
        href={block.content}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          padding: 10,
          textDecoration: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            background: C.edge + "30",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {meta.ogImage && (
            <img
              src={meta.ogImage}
              alt=""
              style={{
                width: 80,
                height: 60,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ padding: "8px 10px 8px 0", minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                color: C.t1,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {meta.ogTitle}
            </div>
            {meta.ogSiteName && (
              <div style={{ fontSize: 10, color: C.t4, marginTop: 2 }}>
                {meta.ogSiteName}
              </div>
            )}
          </div>
        </div>
      </a>
    );
  }

  if (readOnly) {
    return (
      <a
        href={block.content}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          padding: "10px 12px",
          fontSize: 12,
          color: C.blue,
          textDecoration: "none",
        }}
      >
        {block.content}
      </a>
    );
  }

  return (
    <input
      type="url"
      value={block.content || ""}
      onChange={(e) => handleUrlChange(e.target.value)}
      placeholder="Paste URL..."
      style={{
        width: "100%",
        padding: "10px 12px",
        fontSize: 12,
        color: C.t1,
        background: "transparent",
        border: "none",
        outline: "none",
      }}
    />
  );
}

function BlockEmbed({
  block,
  onUpdate,
  readOnly,
}: {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  readOnly: boolean;
}) {
  const C = useC();

  // Simple embed detection
  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch")) {
      const id = new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("vimeo.com/")) {
      const id = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${id}`;
    }
    if (url.includes("soundcloud.com/")) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false`;
    }
    return null;
  };

  const embedUrl = block.content ? getEmbedUrl(block.content) : null;

  if (embedUrl) {
    return (
      <div style={{ padding: 10 }}>
        <div
          style={{
            position: "relative",
            paddingBottom: "56.25%",
            height: 0,
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <iframe
            src={embedUrl}
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
      </div>
    );
  }

  if (readOnly) {
    return (
      <div style={{ padding: "10px 12px", fontSize: 12, color: C.t3 }}>
        {block.content || "No embed URL"}
      </div>
    );
  }

  return (
    <input
      type="url"
      value={block.content || ""}
      onChange={(e) => onUpdate({ content: e.target.value })}
      placeholder="Paste YouTube, Vimeo, or SoundCloud URL..."
      style={{
        width: "100%",
        padding: "10px 12px",
        fontSize: 12,
        color: C.t1,
        background: "transparent",
        border: "none",
        outline: "none",
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add block button
// ─────────────────────────────────────────────────────────────────────────────

function AddBlockButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  const C = useC();

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 10px",
        fontSize: 11,
        color: C.t3,
        background: C.edge + "50",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
