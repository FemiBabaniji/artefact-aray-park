"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";

type ClientUploadProps = {
  slug: string;
  roomKey: string;
  token?: string;
  onUploadComplete?: (blockId: string, fileName: string) => void;
};

export function ClientUpload({
  slug,
  roomKey,
  token,
  onUploadComplete,
}: ClientUploadProps) {
  const C = useC();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("roomKey", roomKey);
      if (caption) formData.append("caption", caption);
      if (token) formData.append("token", token);

      const res = await fetch(`/api/portal/${slug}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setSuccess(`Uploaded ${file.name}`);
      setCaption("");
      onUploadComplete?.(data.block.id, data.block.fileName);

      // Clear success after 3s
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      {/* Caption input */}
      <input
        type="text"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Add a description (optional)"
        style={{
          width: "100%",
          padding: "10px 14px",
          marginBottom: 12,
          background: C.void,
          border: `1px solid ${C.sep}`,
          borderRadius: 8,
          fontSize: 13,
          color: C.t1,
          outline: "none",
        }}
      />

      {/* Drop zone */}
      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        animate={{
          borderColor: isDragging ? C.blue : C.sep,
          background: isDragging ? `${C.blue}08` : C.void,
        }}
        style={{
          padding: "32px 24px",
          border: `2px dashed ${C.sep}`,
          borderRadius: 12,
          textAlign: "center",
          cursor: "pointer",
          transition: "all .15s",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {uploading ? (
          <div style={{ color: C.t3, fontSize: 13 }}>Uploading...</div>
        ) : (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                margin: "0 auto 12px",
                borderRadius: 12,
                background: `${C.blue}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15"
                  stroke={C.blue}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 3V15M12 3L7 8M12 3L17 8"
                  stroke={C.blue}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, color: C.t1, marginBottom: 4 }}>
              Drop files here or click to browse
            </div>
            <div style={{ fontSize: 12, color: C.t4 }}>
              PDF, Word, Excel, images, and more
            </div>
          </>
        )}
      </motion.div>

      {/* Status messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 12,
              padding: "10px 14px",
              background: `${C.amber}15`,
              borderRadius: 8,
              fontSize: 13,
              color: C.amber,
            }}
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              marginTop: 12,
              padding: "10px 14px",
              background: `${C.green}15`,
              borderRadius: 8,
              fontSize: 13,
              color: C.green,
            }}
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
