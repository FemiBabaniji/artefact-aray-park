"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { Btn } from "@/components/primitives/Btn";
import { Lbl } from "@/components/primitives/Lbl";
import { TypedBlockEditor, BLOCK_TYPE_CONFIG } from "./TypedBlockEditor";
import { DocumentBlock } from "@/components/blocks/DocumentBlock";
import type { Block, BlockType } from "@/types/room";
import type { DocumentBlockContent } from "@/types/structured-blocks";

// Typed block types that use the TypedBlockEditor
const TYPED_BLOCK_TYPES: BlockType[] = [
  "project", "skill", "experience", "education", "certification", "metric", "milestone", "relationship"
];

const SP = { type: "spring", stiffness: 300, damping: 30 } as const;
const FADE = { duration: 0.15 } as const;

type LayoutMode = "masonry" | "vertical";

type BlockComposerProps = {
  blocks: Block[];
  purpose?: string;
  onChange: (blocks: Block[]) => void;
  onSubmit?: () => void;
  readOnly?: boolean;
  layout?: LayoutMode;
  columns?: number;
};

export function BlockComposer({
  blocks: propBlocks,
  purpose,
  onChange,
  onSubmit,
  readOnly = false,
  layout = "vertical",
  columns = 2,
}: BlockComposerProps) {
  const C = useC();
  const [preview, setPreview] = useState(false);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);

  // Local state to preserve newly added blocks before they have content
  const [localBlocks, setLocalBlocks] = useState<Block[]>(propBlocks);

  // Sync from props only on initial mount or when props change significantly
  const [initialPropIds] = useState(() => propBlocks.map(b => b.id).join(","));
  useEffect(() => {
    const currentPropIds = propBlocks.map(b => b.id).join(",");
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
      const updated = [...blocks, newBlock];
      updateAndSync(updated);
      setActiveBlock(newBlock.id);
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
      if (activeBlock === id) setActiveBlock(null);
    },
    [blocks, updateAndSync, activeBlock]
  );

  // Distribute blocks into columns for masonry
  const getColumns = () => {
    const cols: Block[][] = Array.from({ length: columns }, () => []);
    blocks.forEach((block, i) => {
      cols[i % columns].push(block);
    });
    return cols;
  };

  const masonryCols = getColumns();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      {/* Toolbar */}
      {!readOnly && (
        <BlockToolbar
          onAddBlock={addBlock}
          preview={preview}
          onTogglePreview={() => setPreview((p) => !p)}
        />
      )}

      {/* Purpose prompt */}
      {purpose && blocks.length === 0 && (
        <p style={{ fontSize: 13, color: C.t3, lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
          {purpose}
        </p>
      )}

      {/* Block grid */}
      {blocks.length > 0 && (
        layout === "masonry" ? (
          // Masonry: multi-column grid
          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: 12,
              alignItems: "start",
              overflow: "auto",
            }}
          >
            {masonryCols.map((col, ci) => (
              <div key={ci} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {col.map((block) => (
                  <MasonryBlock
                    key={block.id}
                    block={block}
                    isActive={activeBlock === block.id && !preview}
                    onActivate={() => !preview && !readOnly && setActiveBlock(block.id)}
                    onUpdate={(updates) => updateBlock(block.id, updates)}
                    onDelete={() => deleteBlock(block.id)}
                    readOnly={readOnly || preview}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          // Vertical: single column list
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, overflow: "auto" }}>
            {blocks.map((block) => (
              <MasonryBlock
                key={block.id}
                block={block}
                isActive={activeBlock === block.id && !preview}
                onActivate={() => !preview && !readOnly && setActiveBlock(block.id)}
                onUpdate={(updates) => updateBlock(block.id, updates)}
                onDelete={() => deleteBlock(block.id)}
                readOnly={readOnly || preview}
              />
            ))}
          </div>
        )
      )}

      {/* Empty state */}
      {blocks.length === 0 && !purpose && (
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.t4,
          fontSize: 12,
        }}>
          Add blocks to build your page
        </div>
      )}

      {/* Submit */}
      {!readOnly && !preview && blocks.length > 0 && onSubmit && (
        <Btn onClick={onSubmit} style={{ alignSelf: "flex-end" }}>
          Send for feedback →
        </Btn>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Masonry Block - card in the grid, click to edit
// ─────────────────────────────────────────────────────────────────────────────

type MasonryBlockProps = {
  block: Block;
  isActive: boolean;
  onActivate: () => void;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
  readOnly: boolean;
};

function MasonryBlock({ block, isActive, onActivate, onUpdate, onDelete, readOnly }: MasonryBlockProps) {
  const C = useC();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={SP}
      onClick={!isActive ? onActivate : undefined}
      style={{
        background: C.bg,
        border: `1px solid ${isActive ? C.blue : C.edge}`,
        borderRadius: 12,
        overflow: "hidden",
        cursor: isActive ? "default" : "pointer",
        position: "relative",
      }}
    >
      {/* Delete button - only when active */}
      {isActive && !readOnly && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 20,
            height: 20,
            fontSize: 12,
            color: C.t4,
            background: C.void,
            border: `1px solid ${C.edge}`,
            borderRadius: 4,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          ×
        </button>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {block.blockType === "document" ? (
          <div style={{ padding: 4 }}>
            <DocumentBlock content={block.metadata as DocumentBlockContent} />
          </div>
        ) : TYPED_BLOCK_TYPES.includes(block.blockType) ? (
          <TypedBlockEditor
            blockType={block.blockType}
            content={block.metadata || {}}
            onChange={(content) => onUpdate({ metadata: content })}
            onDelete={onDelete}
            readOnly={readOnly}
          />
        ) : isActive && !readOnly ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
          >
            {block.blockType === "text" && <BlockTextEdit block={block} onUpdate={onUpdate} />}
            {block.blockType === "image" && <BlockImageEdit block={block} onUpdate={onUpdate} />}
            {block.blockType === "link" && <BlockLinkEdit block={block} onUpdate={onUpdate} />}
            {block.blockType === "embed" && <BlockEmbedEdit block={block} onUpdate={onUpdate} />}
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}
          >
            {block.blockType === "text" && <BlockTextView block={block} />}
            {block.blockType === "image" && <BlockImageView block={block} />}
            {block.blockType === "link" && <BlockLinkView block={block} />}
            {block.blockType === "embed" && <BlockEmbedView block={block} />}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Block View Components (Tumblr-style display)
// ─────────────────────────────────────────────────────────────────────────────

function BlockTextView({ block }: { block: Block }) {
  const C = useC();
  const content = block.content || "";

  if (!content) {
    return (
      <div style={{ padding: 16, color: C.t4, fontSize: 12, fontStyle: "italic" }}>
        Empty text block
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        fontSize: 14,
        color: C.t1,
        lineHeight: 1.7,
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

function BlockImageView({ block }: { block: Block }) {
  const C = useC();

  if (!block.storagePath) {
    return (
      <div style={{
        padding: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: C.t4,
        fontSize: 12,
        background: C.edge + "20",
      }}>
        ◫
      </div>
    );
  }

  return (
    <div>
      <img
        src={block.storagePath}
        alt={block.caption || ""}
        style={{
          width: "100%",
          display: "block",
        }}
      />
      {block.caption && (
        <div style={{ padding: "10px 14px", fontSize: 12, color: C.t3, lineHeight: 1.5 }}>
          {block.caption}
        </div>
      )}
    </div>
  );
}

function BlockLinkView({ block }: { block: Block }) {
  const C = useC();
  const meta = block.metadata;

  if (meta?.ogImage) {
    return (
      <a href={block.content} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none" }}>
        <img src={meta.ogImage} alt="" style={{ width: "100%", display: "block" }} />
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontSize: 13, color: C.t1, fontWeight: 500, marginBottom: 4 }}>{meta.ogTitle}</div>
          {meta.ogDescription && (
            <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5 }}>{meta.ogDescription}</div>
          )}
          {meta.ogSiteName && (
            <div style={{ fontSize: 10, color: C.t4, marginTop: 6 }}>{meta.ogSiteName}</div>
          )}
        </div>
      </a>
    );
  }

  if (meta?.ogTitle) {
    return (
      <a href={block.content} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", padding: 14 }}>
        <div style={{ fontSize: 13, color: C.t1, fontWeight: 500, marginBottom: 4 }}>{meta.ogTitle}</div>
        {meta.ogDescription && (
          <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.5 }}>{meta.ogDescription}</div>
        )}
        <div style={{ fontSize: 10, color: C.blue, marginTop: 6 }}>{block.content}</div>
      </a>
    );
  }

  return (
    <a href={block.content} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: 14, textDecoration: "none" }}>
      <div style={{ fontSize: 12, color: C.blue }}>{block.content || "Empty link"}</div>
    </a>
  );
}

function BlockEmbedView({ block }: { block: Block }) {
  const C = useC();
  const embedUrl = block.content ? getEmbedUrl(block.content) : null;

  if (!embedUrl) {
    return (
      <div style={{ padding: 24, display: "flex", alignItems: "center", justifyContent: "center", color: C.t4, fontSize: 12 }}>
        ▶ No embed
      </div>
    );
  }

  return (
    <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
      <iframe
        src={embedUrl}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Block Edit Components
// ─────────────────────────────────────────────────────────────────────────────

function BlockTextEdit({ block, onUpdate }: { block: Block; onUpdate: (u: Partial<Block>) => void }) {
  const C = useC();
  return (
    <textarea
      value={block.content || ""}
      onChange={(e) => onUpdate({ content: e.target.value })}
      placeholder="Write something..."
      autoFocus
      style={{
        width: "100%",
        padding: 14,
        fontSize: 14,
        color: C.t1,
        caretColor: C.t1,
        WebkitTextFillColor: C.t1,
        background: "transparent",
        border: "none",
        outline: "none",
        resize: "vertical",
        minHeight: 80,
        lineHeight: 1.6,
        fontFamily: "inherit",
      }}
    />
  );
}

function BlockImageEdit({ block, onUpdate }: { block: Block; onUpdate: (u: Partial<Block>) => void }) {
  const C = useC();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = URL.createObjectURL(file);
    onUpdate({ storagePath: url });
    setUploading(false);
  };

  return (
    <div style={{ padding: 12 }}>
      {block.storagePath ? (
        <>
          <img src={block.storagePath} alt="" style={{ width: "100%", borderRadius: 6, marginBottom: 8 }} />
          <textarea
            value={block.caption || ""}
            onChange={(e) => onUpdate({ caption: e.target.value })}
            placeholder="Add caption..."
            rows={1}
            style={{
              width: "100%",
              padding: "8px 0",
              fontSize: 12,
              color: C.t1,
              caretColor: C.t1,
              WebkitTextFillColor: C.t1,
              background: "transparent",
              border: "none",
              borderBottom: `1px solid ${C.edge}`,
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
            }}
          />
          <label style={{ display: "block", marginTop: 8, fontSize: 11, color: C.t4, cursor: "pointer" }}>
            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
            Replace image
          </label>
        </>
      ) : (
        <label style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          border: `2px dashed ${C.edge}`,
          borderRadius: 8,
          color: C.t4,
          fontSize: 12,
          cursor: "pointer",
        }}>
          <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
          <span style={{ fontSize: 24, marginBottom: 8 }}>◫</span>
          {uploading ? "Uploading..." : "Click to upload"}
        </label>
      )}
    </div>
  );
}

function BlockLinkEdit({ block, onUpdate }: { block: Block; onUpdate: (u: Partial<Block>) => void }) {
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
            metadata: { ogTitle: data.title, ogDescription: data.description, ogImage: data.image, ogSiteName: data.siteName },
          });
        }
      } catch { /* ignore */ }
      setFetching(false);
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <textarea
        value={block.content || ""}
        onChange={(e) => handleUrlChange(e.target.value)}
        placeholder="Paste URL..."
        autoFocus
        rows={1}
        style={{
          width: "100%",
          padding: 10,
          fontSize: 12,
          color: C.t1,
          caretColor: C.t1,
          WebkitTextFillColor: C.t1,
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${C.edge}`,
          outline: "none",
          resize: "none",
          fontFamily: "inherit",
        }}
      />
      {fetching && <div style={{ fontSize: 10, color: C.t4, marginTop: 6 }}>Fetching preview...</div>}
      {block.metadata?.ogTitle && (
        <div style={{ marginTop: 10, padding: 10, background: C.edge + "20", borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: C.t2, fontWeight: 500 }}>{block.metadata.ogTitle}</div>
          {block.metadata.ogSiteName && <div style={{ fontSize: 10, color: C.t4, marginTop: 2 }}>{block.metadata.ogSiteName}</div>}
        </div>
      )}
    </div>
  );
}

function BlockEmbedEdit({ block, onUpdate }: { block: Block; onUpdate: (u: Partial<Block>) => void }) {
  const C = useC();
  const embedUrl = block.content ? getEmbedUrl(block.content) : null;

  return (
    <div style={{ padding: 12 }}>
      <textarea
        value={block.content || ""}
        onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="YouTube, Vimeo, or SoundCloud URL..."
        autoFocus
        rows={1}
        style={{
          width: "100%",
          padding: 10,
          fontSize: 12,
          color: C.t1,
          caretColor: C.t1,
          WebkitTextFillColor: C.t1,
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${C.edge}`,
          outline: "none",
          resize: "none",
          fontFamily: "inherit",
        }}
      />
      {embedUrl && (
        <div style={{ marginTop: 10, position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 6, overflow: "hidden" }}>
          <iframe
            src={embedUrl}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

// Helper for embed URLs
function getEmbedUrl(url: string): string | null {
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
  if (url.includes("spotify.com/")) {
    // Convert spotify URL to embed
    const match = url.match(/spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Add block button
// ─────────────────────────────────────────────────────────────────────────────

function AddBlockButton({
  icon,
  label,
  onClick,
  color,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  color?: string;
}) {
  const C = useC();

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, background: color ? color + "22" : C.edge }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 10px",
        fontSize: 11,
        color: color || C.t3,
        background: C.edge + "50",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Block Toolbar with expandable typed blocks
// ─────────────────────────────────────────────────────────────────────────────

function BlockToolbar({
  onAddBlock,
  preview,
  onTogglePreview,
}: {
  onAddBlock: (type: BlockType) => void;
  preview: boolean;
  onTogglePreview: () => void;
}) {
  const C = useC();
  const [showMore, setShowMore] = useState(false);

  const basicBlocks: { type: BlockType; icon: string; label: string }[] = [
    { type: "text", icon: "T", label: "Text" },
    { type: "image", icon: "\u25A3", label: "Image" },
    { type: "link", icon: "\u2197", label: "Link" },
    { type: "embed", icon: "\u25B6", label: "Embed" },
  ];

  const typedBlocks: { type: BlockType; icon: string; label: string; color: string }[] = [
    { type: "project", icon: "\u25A6", label: "Project", color: "#22c55e" },
    { type: "skill", icon: "\u2713", label: "Skill", color: "#14b8a6" },
    { type: "experience", icon: "\u2261", label: "Experience", color: "#f97316" },
    { type: "education", icon: "\u2302", label: "Education", color: "#8b5cf6" },
    { type: "certification", icon: "\u2714", label: "Certification", color: "#06b6d4" },
    { type: "metric", icon: "#", label: "Metric", color: "#fbbf24" },
    { type: "milestone", icon: "\u2605", label: "Milestone", color: "#a78bfa" },
    { type: "relationship", icon: "\u2194", label: "Connection", color: "#ec4899" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
      {/* Main row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {basicBlocks.map((b) => (
            <AddBlockButton key={b.type} icon={b.icon} label={b.label} onClick={() => onAddBlock(b.type)} />
          ))}
          <motion.button
            onClick={() => setShowMore((p) => !p)}
            whileHover={{ background: C.edge }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 10px",
              fontSize: 11,
              color: showMore ? C.blue : C.t3,
              background: showMore ? C.blue + "15" : C.edge + "50",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            <span>{showMore ? "\u2212" : "+"}</span>
            <span>{showMore ? "Less" : "More"}</span>
          </motion.button>
        </div>
        <Btn
          onClick={onTogglePreview}
          accent={preview ? C.blue : undefined}
          style={{ fontSize: 9 }}
        >
          {preview ? "\u2190 edit" : "preview \u2192"}
        </Btn>
      </div>

      {/* Typed blocks row */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                paddingTop: 4,
                paddingBottom: 4,
                borderTop: `1px solid ${C.sep}`,
              }}
            >
              {typedBlocks.map((b) => (
                <AddBlockButton
                  key={b.type}
                  icon={b.icon}
                  label={b.label}
                  color={b.color}
                  onClick={() => {
                    onAddBlock(b.type);
                    setShowMore(false);
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
