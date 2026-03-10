"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useC } from "@/hooks/useC";
import { Lbl } from "@/components/primitives/Lbl";
import { Btn } from "@/components/primitives/Btn";
import type { DocumentBlock } from "@/types/document";

type IngestContentProps = {
  blocks: DocumentBlock[];
  onBlocksChange: (blocks: DocumentBlock[]) => void;
  onPull: (content: string, sourceId?: string) => void;
  compact?: boolean;
};

export function IngestContent({
  blocks,
  onBlocksChange,
  onPull,
  compact,
}: IngestContentProps) {
  const C = useC();
  const [content, setContent] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);

  const plain = content.replace(/<[^>]+>/g, "").trim();
  const words = plain.split(/\s+/).filter(Boolean);
  const hasContent = plain.length > 0 || blocks.length > 0;
  const docCount = blocks.filter((b) => b.type === "document").length;

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
    const blockId = `doc_${crypto.randomUUID().slice(0, 8)}`;
    const newBlock: DocumentBlock = {
      id: blockId,
      type: "document",
      document: {
        id: blockId,
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

    const updatedBlocks = [...blocks, newBlock];
    onBlocksChange(updatedBlocks);

    if (file.type === "application/pdf" || file.type === "text/plain" || file.type === "text/markdown") {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("agentic", "true");

        const res = await fetch("/api/ingest/extract", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          const structuredText = data.blocks
            ?.map((b: { type: string; content: string }) => `[${b.type}] ${b.content}`)
            .join("\n\n");

          onBlocksChange(
            updatedBlocks.map((b) =>
              b.id === blockId
                ? {
                    ...b,
                    document: {
                      ...b.document!,
                      status: "ready" as const,
                      filename: data.title || b.document!.filename,
                    },
                    extractedContent: {
                      documentId: blockId,
                      rawText: structuredText || data.text,
                      pageCount: data.pageCount,
                      summary: data.summary,
                      blocks: data.blocks,
                    },
                  }
                : b
            )
          );
        }
      } catch (err) {
        console.error("Failed to extract file:", err);
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

  const handleUrlExtract = async () => {
    if (!urlInput.trim()) return;

    setIsExtractingUrl(true);
    try {
      const res = await fetch("/api/ingest/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        const newBlock: DocumentBlock = {
          id: `url_${crypto.randomUUID().slice(0, 8)}`,
          type: "document",
          document: {
            id: `url_${crypto.randomUUID().slice(0, 8)}`,
            type: "url",
            filename: data.title || urlInput,
            size: 0,
            mimeType: "text/html",
            status: "ready",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          orderIndex: blocks.length,
          createdAt: new Date().toISOString(),
          extractedContent: {
            documentId: `url_${crypto.randomUUID().slice(0, 8)}`,
            rawText: data.blocks
              ?.map((b: { type: string; content: string }) => `[${b.type}] ${b.content}`)
              .join("\n\n") || data.summary,
            pageCount: 1,
            summary: data.summary,
            blocks: data.blocks,
          },
        };
        onBlocksChange([...blocks, newBlock]);
        setUrlInput("");
      }
    } catch (err) {
      console.error("Failed to extract URL:", err);
    } finally {
      setIsExtractingUrl(false);
    }
  };

  const padding = compact ? 12 : 16;
  const fontSize = {
    label: compact ? 8 : 9,
    body: compact ? 11 : 12,
    small: compact ? 9 : 10,
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: isDragging ? C.blue + "11" : "transparent",
        borderRadius: isDragging ? 8 : 0,
        transition: "background 0.15s",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: compact ? "10px 12px" : "12px 16px",
          borderBottom: `1px solid ${C.sep}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Lbl style={{ fontSize: fontSize.label }}>ingest</Lbl>
          {isProcessing && (
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ fontSize: fontSize.small, color: C.blue }}
            >
              processing...
            </motion.span>
          )}
        </div>
        <Btn
          onClick={handlePull}
          disabled={!hasContent || isProcessing}
          accent={hasContent && !isProcessing ? C.green : undefined}
          style={{ fontSize: compact ? 10 : 11 }}
        >
          pull to artefact
        </Btn>
      </div>

      {/* Body - stacked on mobile, grid on desktop */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: compact ? "column" : "row",
          overflow: "hidden",
        }}
      >
        {/* Main content area */}
        <div style={{ flex: 1, overflow: "auto", padding, display: "flex", flexDirection: "column", gap: compact ? 8 : 12 }}>
          {/* URL input */}
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlExtract()}
              placeholder="Paste URL..."
              disabled={isExtractingUrl}
              style={{
                flex: 1,
                padding: compact ? "6px 8px" : "8px 10px",
                fontSize: fontSize.body,
                background: C.void,
                border: `1px solid ${C.edge}`,
                borderRadius: compact ? 4 : 6,
                color: C.t1,
                outline: "none",
              }}
            />
            <Btn
              onClick={handleUrlExtract}
              disabled={!urlInput.trim() || isExtractingUrl}
              accent={urlInput.trim() && !isExtractingUrl ? C.blue : undefined}
              style={{ fontSize: fontSize.small }}
            >
              {isExtractingUrl ? "..." : "extract"}
            </Btn>
          </div>

          {/* Document blocks */}
          {blocks.filter((b) => b.type === "document").map((block) => (
            <div
              key={block.id}
              style={{
                padding: compact ? "8px 10px" : "10px 14px",
                background: C.sep + "44",
                borderRadius: compact ? 6 : 8,
                borderLeft: `3px solid ${block.document?.status === "ready" ? C.green : C.blue}`,
              }}
            >
              <div style={{ fontSize: fontSize.body, color: C.t2, fontWeight: 500, marginBottom: 2 }}>
                {block.document?.filename}
              </div>
              <div style={{ fontSize: fontSize.small, color: C.t4 }}>
                {block.document?.status === "ready" ? (
                  <>
                    {block.extractedContent?.pageCount} pages &middot;{" "}
                    {Math.round((block.extractedContent?.rawText?.length || 0) / 100)}00 chars
                  </>
                ) : (
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    {block.document?.status}...
                  </motion.span>
                )}
              </div>
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
              minHeight: compact ? 80 : 120,
              outline: "none",
              fontSize: fontSize.body,
              lineHeight: 1.7,
              color: C.t1,
              padding: compact ? "8px 0" : "12px 0",
            }}
          />
        </div>

        {/* Upload sidebar - only on desktop or as bottom section on mobile */}
        <div
          style={{
            width: compact ? "100%" : 140,
            borderLeft: compact ? "none" : `1px solid ${C.sep}`,
            borderTop: compact ? `1px solid ${C.sep}` : "none",
            padding: compact ? "12px" : "14px",
            flexShrink: 0,
          }}
        >
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
              padding: compact ? "10px" : "12px",
              background: C.void,
              border: `1px dashed ${C.edge}`,
              borderRadius: compact ? 6 : 8,
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: compact ? 14 : 16, marginBottom: 4 }}>+</div>
            <div style={{ fontSize: fontSize.small, color: C.t3 }}>
              PDF, slides, text
            </div>
          </motion.button>

          <div style={{ marginTop: compact ? 8 : 12, fontSize: fontSize.small, color: C.t4 }}>
            {docCount} doc{docCount !== 1 ? "s" : ""} &middot; {words.length} words
          </div>
        </div>
      </div>
    </div>
  );
}
