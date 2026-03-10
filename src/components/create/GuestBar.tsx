"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { FADE } from "@/lib/motion";
import { useGuestArtefactContext } from "@/context/GuestArtefactContext";
import { Btn } from "@/components/primitives/Btn";

const DISMISSED_KEY = "artefact_guest_bar_dismissed";

export function GuestBar() {
  const C = useC();
  const { getRoomBlockCount, state } = useGuestArtefactContext();
  const [email, setEmail] = useState("");
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const blockCount = getRoomBlockCount();
  const roomsWithContent = state.rooms.filter((r) => r.blocks.length > 0).length;

  // Check if dismissed on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  // Show more prominently after 2+ rooms have content
  const isProminent = roomsWithContent >= 2;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "true");
  };

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@")) {
      setMessage("Please enter a valid email");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // TODO: Implement actual claim API
      // const res = await fetch("/api/artefact/claim", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     email: email.trim(),
      //     guestSessionId: state.sessionId,
      //   }),
      // });

      // Simulate for now
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage("Magic link sent! Check your email.");
      setEmail("");
    } catch {
      setMessage("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  if (isDismissed && !isProminent) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...FADE, delay: 0.5 }}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "12px 24px",
        background: C.bg,
        borderTop: `1px solid ${isProminent ? C.blue + "44" : C.edge}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        zIndex: 100,
      }}
    >
      {/* Message */}
      <div style={{ fontSize: 12, color: C.t3 }}>
        {isProminent
          ? "You've built something. Claim your link to keep it."
          : "You're editing as a guest — save your link"}
      </div>

      {/* Email input */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="your@email.com"
          style={{
            background: "transparent",
            border: `1px solid ${C.sep}`,
            borderRadius: 4,
            padding: "6px 12px",
            fontSize: 12,
            color: C.t1,
            width: 180,
            outline: "none",
          }}
        />
        <Btn
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            color: C.green,
            opacity: isSubmitting ? 0.5 : 1,
          }}
        >
          {isSubmitting ? "..." : "claim"}
        </Btn>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              fontSize: 11,
              color: message.includes("sent") ? C.green : C.amber,
            }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dismiss button (only when not prominent) */}
      {!isProminent && (
        <Btn
          onClick={handleDismiss}
          style={{ color: C.t4, fontSize: 10, marginLeft: 8 }}
        >
          dismiss
        </Btn>
      )}
    </motion.div>
  );
}
