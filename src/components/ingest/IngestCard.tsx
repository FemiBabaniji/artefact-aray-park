"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE, SP } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import type { DocumentBlock } from "@/types/document";

type IngestCardProps = {
  expanded: boolean;
  onToggle: () => void;
  blocks: DocumentBlock[];
  onBlocksChange: (blocks: DocumentBlock[]) => void;
  onPull: (content: string, sourceId?: string) => void;
  onClose?: () => void;
};

export function IngestCard({
  expanded,
  onToggle,
  blocks,
  onBlocksChange,
  onPull,
  onClose,
}: IngestCardProps) {
  const C = useC();
  const [content, setContent] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const W = expanded ? "min(56vw, 54vh)" : "158px";
  const H = expanded ? "min(72vh, 70vw)" : "136px";

  // Preview text for collapsed state
  const plain = content.replace(/<[^>]+>/g, "").trim();
  const words = plain.split(/\s+/).filter(Boolean);
  const preview = words.slice(0, 12).join(" ") + (words.length > 12 ? "..." : "");
  const hasContent = plain.length > 0 || blocks.length > 0;

  const docCount = blocks.filter((b) => b.type === "document").length;
  const textCount = blocks.filter((b) => b.type === "text").length;

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      setIsProcessing(true);
      for (const file of files) {
        await processFile(file);
      }
      setIsProcessing(false);
    },
    [blocks, onBlocksChange]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      setIsProcessing(true);
      for (const file of files) {
        await processFile(file);
      }
      setIsProcessing(false);
      e.target.value = "";
    },
    [blocks, onBlocksChange]
  );

  const processFile = async (file: File) => {
    const newBlock: DocumentBlock = {
      id: `doc_${crypto.randomUUID().slice(0, 8)}`,
      type: "document",
      document: {
        id: `doc_${crypto.randomUUID().slice(0, 8)}`,
        type: file.type === "application/pdf" ? "pdf" :
              file.type.includes("presentation") ? "slides" : "text",
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        status: "uploading",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      orderIndex: blocks.length,
      createdAt: new Date().toISOString(),
    };

    onBlocksChange([...blocks, newBlock]);

    // Extract text from PDF
    if (file.type === "application/pdf") {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/ingest/extract", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          onBlocksChange(
            blocks.map((b) =>
              b.id === newBlock.id
                ? {
                    ...b,
                    document: { ...b.document!, status: "ready" as const },
                    extractedContent: {
                      documentId: newBlock.id,
                      rawText: data.text,
                      pageCount: data.pageCount,
                    },
                  }
                : b
            ).concat(newBlock.id === blocks[blocks.length]?.id ? [] : [{
              ...newBlock,
              document: { ...newBlock.document!, status: "ready" as const },
              extractedContent: {
                documentId: newBlock.id,
                rawText: data.text,
                pageCount: data.pageCount,
              },
            }])
          );
        }
      } catch (err) {
        console.error("Failed to extract PDF:", err);
      }
    }
  };

  const handlePull = () => {
    const textContent = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const docContent = blocks
      .filter((b) => b.extractedContent?.rawText)
      .map((b) => b.extractedContent!.rawText)
      .join("\n\n");

    const combined = [textContent, docContent].filter(Boolean).join("\n\n");
    if (combined) {
      onPull(combined);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 5,
        flexShrink: 0,
      }}
    >
      <motion.div
        onClick={!expanded ? onToggle : undefined}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        animate={{
          width: W,
          height: H,
          borderColor: isDragging ? C.blue : C.edge,
          background: isDragging ? C.blue + "11" : C.void,
        }}
        transition={SP}
        style={{
          border: `1px solid ${C.edge}`,
          borderRadius: 12,
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
          cursor: expanded ? "default" : "pointer",
        }}
      >
        <AnimatePresence mode="wait">
          {!expanded ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              style={{ height: "100%" }}
            >
              {/* Compact header */}
              <div
                style={{
                  padding: "9px 16px 7px",
                  borderBottom: `1px solid ${C.sep}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Lbl>ingest</Lbl>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isProcessing && (
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ fontSize: 9, color: C.blue }}
                    >
                      processing...
                    </motion.span>
                  )}
                  {onClose && (
                    <Btn onClick={() => onClose()} style={{ fontSize: 9, color: C.t4 }}>
                      &times;
                    </Btn>
                  )}
                </div>
              </div>

              {/* Compact body */}
              <div
                style={{
                  padding: "10px 16px 12px",
                  height: "calc(100% - 32px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                }}
              >
                {/* Document dots */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 2,
                        background:
                          block.type === "document"
                            ? block.document?.status === "ready"
                              ? C.green
                              : C.blue
                            : C.sep,
                      }}
                    />
                  ))}
                  {blocks.length === 0 && (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 2,
                        background: C.sep,
                      }}
                    />
                  )}
                </div>

                {hasContent ? (
                  <>
                    <div
                      style={{
                        flex: 1,
                        fontSize: 11,
                        color: C.t3,
                        lineHeight: 1.55,
                        overflow: "hidden",
                      }}
                    >
                      {docCount > 0 && (
                        <span style={{ color: C.t2 }}>
                          {docCount} doc{docCount > 1 ? "s" : ""}
                          {preview ? " · " : ""}
                        </span>
                      )}
                      {preview}
                    </div>
                    <Btn onClick={onToggle} style={{ textAlign: "left" }}>
                      &darr; open
                    </Btn>
                  </>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ fontSize: 11, color: C.t4, lineHeight: 1.6 }}>
                      Drop PDFs, slides, or paste text.
                    </div>
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Btn
                        onClick={onToggle}
                        style={{ textAlign: "left", color: C.t2 }}
                      >
                        &darr; open to begin
                      </Btn>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              style={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              {/* Expanded header */}
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: `1px solid ${C.sep}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Lbl>ingest</Lbl>
                  {isProcessing && (
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ fontSize: 9, color: C.blue }}
                    >
                      processing...
                    </motion.span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn
                    onClick={handlePull}
                    disabled={!hasContent || isProcessing}
                    accent={hasContent && !isProcessing ? C.green : undefined}
                  >
                    &swarr; pull
                  </Btn>
                  <Btn onClick={onToggle} style={{ color: C.t3 }}>
                    &uarr; collapse
                  </Btn>
                  {onClose && (
                    <Btn onClick={onClose} style={{ color: C.t4 }}>
                      &times;
                    </Btn>
                  )}
                </div>
              </div>

              {/* Expanded body */}
              <div
                style={{
                  flex: 1,
                  display: "grid",
                  gridTemplateColumns: "1fr 160px",
                  overflow: "hidden",
                }}
              >
                {/* Main content area */}
                <div style={{ overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Document blocks */}
                  {blocks.filter((b) => b.type === "document").map((block) => (
                    <div
                      key={block.id}
                      style={{
                        padding: "10px 14px",
                        background: C.sep + "44",
                        borderRadius: 8,
                        borderLeft: `3px solid ${
                          block.document?.status === "ready" ? C.green : C.blue
                        }`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: C.t2,
                          fontWeight: 500,
                          marginBottom: 4,
                        }}
                      >
                        {block.document?.filename}
                      </div>
                      <div style={{ fontSize: 10, color: C.t4 }}>
                        {block.document?.status === "ready" ? (
                          <>
                            {block.extractedContent?.pageCount} pages &middot;{" "}
                            {Math.round(
                              (block.extractedContent?.rawText?.length || 0) / 100
                            )}
                            00 chars
                          </>
                        ) : (
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            {block.document?.status}...
                          </motion.span>
                        )}
                      </div>
                      {block.extractedContent?.rawText && (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 11,
                            color: C.t3,
                            lineHeight: 1.5,
                            maxHeight: 60,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {block.extractedContent.rawText.slice(0, 200)}...
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Text editor */}
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    data-ph="Paste or type text here..."
                    className="editor"
                    style={{
                      flex: 1,
                      minHeight: 120,
                      outline: "none",
                      fontSize: 13,
                      lineHeight: 1.7,
                      color: C.t1,
                    }}
                  />
                </div>

                {/* Sidebar */}
                <div
                  style={{
                    borderLeft: `1px solid ${C.sep}`,
                    overflow: "auto",
                    padding: "14px 16px",
                  }}
                >
                  <Lbl style={{ display: "block", marginBottom: 14 }}>sources</Lbl>

                  {/* Upload button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.pptx,.ppt,.txt,.md"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFileSelect}
                  />
                  <motion.button
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ background: C.sep }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: C.void,
                      border: `1px dashed ${C.edge}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontSize: 16, marginBottom: 4 }}>+</div>
                    <div style={{ fontSize: 10, color: C.t3 }}>
                      PDF, slides, text
                    </div>
                  </motion.button>

                  {/* Source list */}
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      style={{
                        paddingBottom: 8,
                        marginBottom: 8,
                        borderBottom: `1px solid ${C.sep}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: C.t2,
                          marginBottom: 2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {block.type === "document"
                          ? block.document?.filename
                          : "Text input"}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color:
                            block.document?.status === "ready" ? C.green : C.t4,
                        }}
                      >
                        {block.type === "document"
                          ? block.document?.status
                          : "ready"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "12px 16px",
                  borderTop: `1px solid ${C.sep}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: C.t4,
                }}
              >
                <span>
                  {docCount} document{docCount !== 1 ? "s" : ""} &middot;{" "}
                  {words.length} words
                </span>
                <span>Drop files anywhere</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
