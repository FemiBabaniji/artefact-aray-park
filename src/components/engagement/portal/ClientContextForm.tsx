"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";

type ContextType = "brief" | "stakeholders" | "goals" | "constraints" | "general";

type ClientContextFormProps = {
  slug: string;
  roomKey: string;
  token?: string;
  onSubmitComplete?: (blockId: string) => void;
};

const CONTEXT_TYPES: { value: ContextType; label: string; placeholder: string }[] = [
  {
    value: "brief",
    label: "Project Brief",
    placeholder: "Describe your project, goals, and what success looks like...",
  },
  {
    value: "stakeholders",
    label: "Stakeholders",
    placeholder: "Who are the key stakeholders and decision makers?",
  },
  {
    value: "goals",
    label: "Goals & Objectives",
    placeholder: "What are your primary goals and how will you measure success?",
  },
  {
    value: "constraints",
    label: "Constraints & Timeline",
    placeholder: "Any budget, timeline, or technical constraints we should know about?",
  },
  {
    value: "general",
    label: "Additional Context",
    placeholder: "Any other information that would help us understand your needs...",
  },
];

export function ClientContextForm({
  slug,
  roomKey,
  token,
  onSubmitComplete,
}: ClientContextFormProps) {
  const C = useC();
  const [contextType, setContextType] = useState<ContextType>("general");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedType = CONTEXT_TYPES.find((t) => t.value === contextType)!;

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError("Please enter some content");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/portal/${slug}/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomKey,
          content: content.trim(),
          contextType,
          token,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }

      const data = await res.json();
      setSuccess(true);
      setContent("");
      onSubmitComplete?.(data.block.id);

      // Clear success after 3s
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Context type selector */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {CONTEXT_TYPES.map((type) => (
          <motion.button
            key={type.value}
            whileTap={{ scale: 0.98 }}
            onClick={() => setContextType(type.value)}
            style={{
              padding: "8px 14px",
              background: contextType === type.value ? C.blue : C.void,
              border: `1px solid ${contextType === type.value ? C.blue : C.sep}`,
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              color: contextType === type.value ? "#fff" : C.t2,
              cursor: "pointer",
            }}
          >
            {type.label}
          </motion.button>
        ))}
      </div>

      {/* Content textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={selectedType.placeholder}
        rows={6}
        style={{
          width: "100%",
          padding: "14px",
          background: C.void,
          border: `1px solid ${C.sep}`,
          borderRadius: 10,
          fontSize: 14,
          lineHeight: 1.6,
          color: C.t1,
          resize: "vertical",
          outline: "none",
          fontFamily: "inherit",
        }}
      />

      {/* Submit button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <motion.button
          whileHover={{ opacity: 0.9 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          style={{
            padding: "10px 20px",
            background: submitting || !content.trim() ? C.sep : C.blue,
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            color: submitting || !content.trim() ? C.t4 : "#fff",
            cursor: submitting || !content.trim() ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Submitting..." : "Submit"}
        </motion.button>
      </div>

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
            Your input has been submitted successfully.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
