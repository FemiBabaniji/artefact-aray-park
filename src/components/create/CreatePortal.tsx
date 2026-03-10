"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC, useTheme } from "@/hooks/useC";
import { useIsMobile } from "@/hooks/useBreakpoint";
import { SP } from "@/lib/motion";
import { useGuestArtefactContext } from "@/context/GuestArtefactContext";
import { usePublish } from "@/hooks/usePublish";
import { CompactOutputView } from "./OutputEngine";
import { IngestCard } from "@/components/ingest/IngestCard";
import { PullToArtefactModal } from "@/components/ingest/PullToArtefactModal";
import { useCardColors } from "./hooks";
import {
  CompactCard,
  MiniCard,
  ExpandedArtefact,
  WelcomeMessage,
  PublishModal,
  AuthModal,
} from "./components";
import type { DocumentBlock } from "@/types/document";

export function CreatePortal() {
  const C = useC();
  const isMobile = useIsMobile();
  const { toggle: toggleTheme, dark } = useTheme();
  const { state, isLoaded, addRoom, addBlock } = useGuestArtefactContext();
  const { publish, isPublishing, slug, publicUrl, error: publishError, reset: resetPublish } = usePublish();

  // View state
  const [compact, setCompact] = useState(true);
  const [compactMode, setCompactMode] = useState<"card" | "outputs">("card");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Ingest state
  const [ingestBlocks, setIngestBlocks] = useState<DocumentBlock[]>([]);
  const [ingestExpanded, setIngestExpanded] = useState(false);
  const [showPullModal, setShowPullModal] = useState(false);
  const [pullContent, setPullContent] = useState("");

  // Theme/color state
  const theme = useCardColors(C);
  const [colorId, setColorId] = useState(theme.isDark ? "indigo" : "magenta");
  const colorExists = theme.colors.some((c) => c.id === colorId);
  const effectiveColorId = colorExists ? colorId : (theme.isDark ? "indigo" : "magenta");
  const cc = theme.colors.find((c) => c.id === effectiveColorId) || theme.colors[0];

  // Handlers
  const handlePublish = async () => {
    const result = await publish(state.identity, state.rooms);
    if (result.success) {
      setShowPublishModal(true);
    } else if (result.authRequired) {
      setShowAuthModal(true);
    }
  };

  const handleIngestPull = (content: string) => {
    setPullContent(content);
    setShowPullModal(true);
  };

  const handlePullConfirm = (
    target: { type: string; roomId?: string; roomLabel?: string },
    parsedContent: { blocks: Array<{ content: string }> }
  ) => {
    if (target.type === "new_room") {
      const newRoomId = addRoom(target.roomLabel || "Imported content");
      parsedContent.blocks.forEach((block, idx) => {
        addBlock(newRoomId, {
          id: `blk_${crypto.randomUUID().slice(0, 8)}`,
          blockType: "text",
          content: block.content,
          orderIndex: idx,
        });
      });
    } else if (target.type === "room" && target.roomId) {
      const room = state.rooms.find((r) => r.id === target.roomId);
      const startIndex = room?.blocks.length || 0;
      parsedContent.blocks.forEach((block, idx) => {
        addBlock(target.roomId!, {
          id: `blk_${crypto.randomUUID().slice(0, 8)}`,
          blockType: "text",
          content: block.content,
          orderIndex: startIndex + idx,
        });
      });
    }
    setShowPullModal(false);
    setPullContent("");
    setIngestExpanded(false);
    setCompactMode("card");
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.t3,
        }}
      >
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        background: C.void,
      }}
    >
      {/* Welcome messages */}
      <AnimatePresence mode="wait">
        {compact && compactMode === "card" && (
          <WelcomeMessage
            key="welcome-card"
            title="This is your artefact."
            subtitle="Expand it to start building your profile."
          />
        )}
        {compact && compactMode === "outputs" && (
          <WelcomeMessage
            key="welcome-outputs"
            title="Context compiler"
            subtitle="Generate outputs from your artefact."
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <AnimatePresence mode="wait">
          {!compact && ingestExpanded ? (
            <motion.div
              key="mini-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={SP}
            >
              <MiniCard
                identity={state.identity}
                accent={cc.accent}
                cardBg={cc.card}
                onClick={() => setIngestExpanded(false)}
                theme={theme}
              />
            </motion.div>
          ) : compact ? (
            compactMode === "card" ? (
              <motion.div
                key="compact-card"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={SP}
              >
                <CompactCard
                  identity={state.identity}
                  rooms={state.rooms}
                  accent={cc.accent}
                  cardBg={cc.card}
                  onExpand={() => setCompact(false)}
                  onShowOutputs={() => setCompactMode("outputs")}
                  colorId={colorId}
                  onColorChange={setColorId}
                  theme={theme}
                  dark={dark}
                  onToggleTheme={toggleTheme}
                />
              </motion.div>
            ) : (
              <motion.div
                key="compact-outputs"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={SP}
              >
                <CompactOutputView
                  identity={state.identity}
                  rooms={state.rooms}
                  accent={cc.accent}
                  cardBg={cc.card}
                  theme={theme}
                  onBack={() => setCompactMode("card")}
                  onPublish={handlePublish}
                  isPublishing={isPublishing}
                />
              </motion.div>
            )
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={SP}
            >
              <ExpandedArtefact
                accent={cc.accent}
                cardBg={cc.card}
                colorId={colorId}
                onColorChange={setColorId}
                onCollapse={() => setCompact(true)}
                theme={theme}
                dark={dark}
                onToggleTheme={toggleTheme}
                ingestBlocks={ingestBlocks}
                onIngestBlocksChange={setIngestBlocks}
                onIngestPull={handleIngestPull}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ingest side panel - desktop only */}
        {!compact && !isMobile && (
          <IngestCard
            expanded={ingestExpanded}
            onToggle={() => setIngestExpanded(!ingestExpanded)}
            blocks={ingestBlocks}
            onBlocksChange={setIngestBlocks}
            onPull={handleIngestPull}
          />
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showPublishModal && slug && (
          <PublishModal
            slug={slug}
            publicUrl={publicUrl}
            accent={cc.accent}
            onClose={() => {
              setShowPublishModal(false);
              resetPublish();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            accent={cc.accent}
            error={publishError}
            onClose={() => {
              setShowAuthModal(false);
              resetPublish();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPullModal && pullContent && (
          <PullToArtefactModal
            content={pullContent}
            sourceLabel="Ingested content"
            rooms={state.rooms}
            onConfirm={handlePullConfirm}
            onDismiss={() => {
              setShowPullModal(false);
              setPullContent("");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
