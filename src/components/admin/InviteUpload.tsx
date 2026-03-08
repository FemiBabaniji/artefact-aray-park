"use client";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE } from "@/lib/motion";
import { Btn } from "@/components/primitives/Btn";
import { Lbl } from "@/components/primitives/Lbl";

type Invite = { email: string; name: string };

type InviteUploadProps = {
  communityName: string;
  programName: string;
  onComplete?: (results: { sent: number; failed: number }) => void;
};

export function InviteUpload({ communityName, programName, onComplete }: InviteUploadProps) {
  const C = useC();
  const fileRef = useRef<HTMLInputElement>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<{ sent: number; failed: number } | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    const res = await fetch("/api/invites", {
      method: "PUT",
      body: text,
    });

    const data = await res.json();
    setInvites(data.invites || []);
    setErrors(data.errors || []);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes("@")) return;

    const res = await fetch("/api/invites", {
      method: "PUT",
      body: text,
    });

    const data = await res.json();
    setInvites(data.invites || []);
    setErrors(data.errors || []);
  };

  const removeInvite = (index: number) => {
    setInvites(prev => prev.filter((_, i) => i !== index));
  };

  const sendInvites = async () => {
    if (invites.length === 0) return;

    setSending(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invites, communityName, programName }),
      });

      const data = await res.json();
      setResults({ sent: data.sent, failed: data.failed });
      onComplete?.({ sent: data.sent, failed: data.failed });
    } catch (err) {
      console.error("Failed to send invites:", err);
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setInvites([]);
    setErrors([]);
    setResults(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div style={{ background: C.void, border: `1px solid ${C.edge}`, borderRadius: 12, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.sep}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Lbl>invite members</Lbl>
        {invites.length > 0 && !results && (
          <Btn onClick={reset} style={{ fontSize: 10 }}>clear</Btn>
        )}
      </div>

      <div style={{ padding: 20 }}>
        <AnimatePresence mode="wait">
          {results ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}
              style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>
                {results.failed === 0 ? "✓" : "⚠"}
              </div>
              <div style={{ fontSize: 14, color: C.t1, fontWeight: 500, marginBottom: 4 }}>
                {results.sent} invite{results.sent !== 1 ? "s" : ""} sent
              </div>
              {results.failed > 0 && (
                <div style={{ fontSize: 12, color: C.amber }}>
                  {results.failed} failed
                </div>
              )}
              <Btn onClick={reset} accent={C.blue} style={{ marginTop: 16 }}>
                Send more
              </Btn>
            </motion.div>
          ) : invites.length > 0 ? (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}>
              <div style={{ maxHeight: 200, overflow: "auto", marginBottom: 16 }}>
                {invites.map((inv, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", background: i % 2 === 0 ? "transparent" : C.sep + "22",
                    borderRadius: 6,
                  }}>
                    <div>
                      <span style={{ fontSize: 13, color: C.t1 }}>{inv.name}</span>
                      <span style={{ fontSize: 11, color: C.t4, marginLeft: 8 }}>{inv.email}</span>
                    </div>
                    <Btn onClick={() => removeInvite(i)} style={{ fontSize: 10, color: C.t4 }}>×</Btn>
                  </div>
                ))}
              </div>

              {errors.length > 0 && (
                <div style={{ fontSize: 11, color: C.amber, marginBottom: 12 }}>
                  {errors.length} row{errors.length !== 1 ? "s" : ""} skipped
                </div>
              )}

              <Btn onClick={sendInvites} accent={C.green} disabled={sending} style={{ width: "100%" }}>
                {sending ? "Sending..." : `Send ${invites.length} invite${invites.length !== 1 ? "s" : ""}`}
              </Btn>
            </motion.div>
          ) : (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={FADE}>
              <div
                onClick={() => fileRef.current?.click()}
                onPaste={handlePaste}
                tabIndex={0}
                style={{
                  border: `2px dashed ${C.sep}`, borderRadius: 8, padding: "32px 24px",
                  textAlign: "center", cursor: "pointer", transition: "border-color 0.15s",
                }}
              >
                <div style={{ fontSize: 13, color: C.t2, marginBottom: 8 }}>
                  Drop CSV file or paste data
                </div>
                <div style={{ fontSize: 11, color: C.t4 }}>
                  Format: name, email (one per line)
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFile}
                style={{ display: "none" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
