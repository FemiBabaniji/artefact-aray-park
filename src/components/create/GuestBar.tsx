"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { useIsMobile } from "@/hooks/useBreakpoint";
import { useAuth } from "@/hooks/useAuth";
import { FADE } from "@/lib/motion";
import { useGuestArtefactContext } from "@/context/GuestArtefactContext";
import { Btn } from "@/components/primitives/Btn";

const DISMISSED_KEY = "artefact_guest_bar_dismissed";
const PENDING_CLAIM_KEY = "artefact_pending_claim";

type ClaimState = "idle" | "sending" | "sent" | "claiming" | "claimed" | "error";

export function GuestBar() {
  const C = useC();
  const isMobile = useIsMobile();
  const { user, isLoading: authLoading, isAuthenticated, signInWithEmail } = useAuth();
  const { getRoomBlockCount, state, events, artefactState, publish } = useGuestArtefactContext();

  const [email, setEmail] = useState("");
  const [isDismissed, setIsDismissed] = useState(false);
  const [claimState, setClaimState] = useState<ClaimState>("idle");
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

  // Handle post-auth claim flow
  useEffect(() => {
    const pendingClaim = localStorage.getItem(PENDING_CLAIM_KEY);

    if (isAuthenticated && user && pendingClaim === "true" && claimState === "idle") {
      // User just authenticated - complete the claim
      handleClaimArtefact();
      localStorage.removeItem(PENDING_CLAIM_KEY);
    }
  }, [isAuthenticated, user, claimState]);

  // Show more prominently after 2+ rooms have content
  const isProminent = roomsWithContent >= 2;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "true");
  };

  // Send magic link email
  const handleSendMagicLink = async () => {
    if (!email.trim() || !email.includes("@")) {
      setMessage("Please enter a valid email");
      return;
    }

    setClaimState("sending");
    setMessage(null);

    // Mark that we have a pending claim for when user returns
    localStorage.setItem(PENDING_CLAIM_KEY, "true");

    const { error } = await signInWithEmail(email.trim(), "/create");

    if (error) {
      setClaimState("error");
      setMessage(error);
      localStorage.removeItem(PENDING_CLAIM_KEY);
    } else {
      setClaimState("sent");
      setMessage("Magic link sent! Check your email to claim your artefact.");
      setEmail("");
    }
  };

  // Actually claim the artefact (called after auth)
  const handleClaimArtefact = async () => {
    if (!user || !state.sessionId) return;

    setClaimState("claiming");
    setMessage("Claiming your artefact...");

    try {
      const response = await fetch("/api/artefact/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artefactId: artefactState.id,
          sessionId: state.sessionId,
          events: events,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setClaimState("claimed");
        setMessage(`Claimed! Your artefact is saved.`);

        // Auto-publish if they have content
        if (blockCount > 0 && result.slug) {
          publish(result.slug);
        }
      } else {
        setClaimState("error");
        setMessage(result.message || "Failed to claim artefact");
      }
    } catch {
      setClaimState("error");
      setMessage("Network error. Please try again.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMagicLink();
    }
  };

  // Don't show if loading auth state
  if (authLoading) {
    return null;
  }

  // Already authenticated and claimed - show minimal status
  if (isAuthenticated && claimState === "claimed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={FADE}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "10px 24px",
          background: C.bg,
          borderTop: `1px solid ${C.green}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          zIndex: 100,
        }}
      >
        <div style={{ fontSize: 11, color: C.green }}>
          Signed in as {user?.email}
        </div>
        <Btn
          onClick={() => setIsDismissed(true)}
          style={{ color: C.t4, fontSize: 10 }}
        >
          dismiss
        </Btn>
      </motion.div>
    );
  }

  // Authenticated but not yet claimed - show claim button
  if (isAuthenticated && claimState !== "claimed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={FADE}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 24px",
          background: C.bg,
          borderTop: `1px solid ${C.blue}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          zIndex: 100,
        }}
      >
        <div style={{ fontSize: 12, color: C.t3 }}>
          {claimState === "claiming" ? "Saving your artefact..." : `Signed in as ${user?.email}`}
        </div>

        {claimState !== "claiming" && (
          <Btn
            onClick={handleClaimArtefact}
            style={{
              color: C.green,
              padding: "6px 14px",
              background: `${C.green}15`,
              borderRadius: 4,
            }}
          >
            save artefact
          </Btn>
        )}

        {message && (
          <div style={{ fontSize: 11, color: claimState === "error" ? C.amber : C.t3 }}>
            {message}
          </div>
        )}
      </motion.div>
    );
  }

  // Not authenticated - show email input for magic link
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
        padding: isMobile ? "12px 16px" : "12px 24px",
        paddingBottom: isMobile ? "calc(12px + env(safe-area-inset-bottom, 0px))" : 12,
        background: C.bg,
        borderTop: `1px solid ${isProminent ? C.blue + "44" : C.edge}`,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: isMobile ? 10 : 16,
        zIndex: 100,
      }}
    >
      {/* Message */}
      <div style={{ fontSize: isMobile ? 11 : 12, color: C.t3, textAlign: isMobile ? "center" : "left" }}>
        {claimState === "sent"
          ? "Check your email"
          : isProminent
            ? "You've built something. Claim your link to keep it."
            : "You're editing as a guest — save your link"}
      </div>

      {/* Email input (only show if not sent) */}
      {claimState !== "sent" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", width: isMobile ? "100%" : "auto" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="your@email.com"
            disabled={claimState === "sending"}
            style={{
              flex: isMobile ? 1 : "none",
              background: "transparent",
              border: `1px solid ${C.sep}`,
              borderRadius: 4,
              padding: "6px 12px",
              fontSize: 12,
              color: C.t1,
              width: isMobile ? "auto" : 180,
              outline: "none",
              opacity: claimState === "sending" ? 0.5 : 1,
            }}
          />
          <Btn
            onClick={handleSendMagicLink}
            disabled={claimState === "sending"}
            style={{
              color: C.green,
              opacity: claimState === "sending" ? 0.5 : 1,
            }}
          >
            {claimState === "sending" ? "sending..." : "claim"}
          </Btn>
        </div>
      )}

      {/* Status message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              fontSize: 11,
              color:
                claimState === "sent" || claimState === "claimed"
                  ? C.green
                  : claimState === "error"
                    ? C.amber
                    : C.t3,
            }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dismiss button (only when not prominent and not in flow) */}
      {!isProminent && claimState === "idle" && !isMobile && (
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
