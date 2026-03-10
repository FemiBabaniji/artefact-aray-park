"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import { SectionFrame } from "./SectionFrame";
import { getTemplateForRoom } from "./templates";
import {
  HeroSection,
  ProfileSection,
  MetricsSection,
  GallerySection,
  TimelineSection,
  DocumentsSection,
  ContentSection,
  AdditionalSection,
} from "./renderers";
import type { PageComposerProps, SectionBlock, SectionType } from "./types";

// ── Section Renderer Registry ────────────────────────────────────────────────

const sectionRenderers: Record<
  SectionType,
  React.ComponentType<{ blocks: SectionBlock[]; accent: string }>
> = {
  hero: HeroSection,
  profile: ProfileSection,
  metrics: MetricsSection,
  gallery: GallerySection,
  timeline: TimelineSection,
  documents: DocumentsSection,
  content: ContentSection,
  additional: AdditionalSection,
};

// ── Page Composer ────────────────────────────────────────────────────────────

export function PageComposer({
  rooms,
  getBlockContent,
  accent,
  activeRoomId,
}: PageComposerProps) {
  const C = useC();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get the active room or first room
  const activeRoom = useMemo(() => {
    if (activeRoomId) {
      return rooms.find((r) => r.id === activeRoomId) || rooms[0];
    }
    return rooms[0];
  }, [rooms, activeRoomId]);

  // Get template for the active room
  const template = useMemo(() => {
    if (!activeRoom) return null;
    return getTemplateForRoom(activeRoom.id, activeRoom.type);
  }, [activeRoom]);

  // Get the active preset layout
  const layout = useMemo(() => {
    if (!template) return null;
    const presetId = activeRoom?.preset || template.defaultPreset;
    return template.presets.find((p) => p.id === presetId) || template.presets[0];
  }, [template, activeRoom?.preset]);

  // Map blocks to sections
  const { sectionBlocks, unmatchedBlocks } = useMemo(() => {
    if (!activeRoom || !layout) {
      return { sectionBlocks: new Map<string, SectionBlock[]>(), unmatchedBlocks: [] };
    }

    const matched = new Set<string>();
    const sectionMap = new Map<string, SectionBlock[]>();

    // Initialize sections
    for (const section of layout.sections) {
      sectionMap.set(section.id, []);
    }

    // Match blocks to sections
    for (const block of activeRoom.blocks) {
      const content = getBlockContent(block.id);
      const blockData: SectionBlock = {
        id: block.id,
        type: block.type,
        content,
        label: block.label,
      };

      // Find which section accepts this block
      let foundSection = false;
      for (const section of layout.sections) {
        if (section.accepts.includes(block.id)) {
          sectionMap.get(section.id)?.push(blockData);
          matched.add(block.id);
          foundSection = true;
          break;
        }
      }

      // If no specific section, add to unmatched
      if (!foundSection) {
        matched.add(block.id); // Still mark as processed
      }
    }

    // Collect unmatched blocks
    const unmatched: SectionBlock[] = activeRoom.blocks
      .filter((b) => {
        const isInAnySection = layout.sections.some((s) => s.accepts.includes(b.id));
        return !isInAnySection;
      })
      .map((b) => ({
        id: b.id,
        type: b.type,
        content: getBlockContent(b.id),
        label: b.label,
      }));

    return { sectionBlocks: sectionMap, unmatchedBlocks: unmatched };
  }, [activeRoom, layout, getBlockContent]);

  // Prevent hydration mismatch by waiting for client mount
  if (!mounted) {
    return (
      <div
        style={{
          padding: 48,
          textAlign: "center",
          color: C.t3,
        }}
      >
        Loading...
      </div>
    );
  }

  if (!activeRoom || !layout) {
    return (
      <div
        style={{
          padding: 48,
          textAlign: "center",
          color: C.t3,
        }}
      >
        No room selected
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={SPF}
      style={{
        minHeight: "100%",
        paddingTop: 32,
        paddingBottom: 64,
      }}
    >
      {/* Room title */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPF, delay: 0.05 }}
        style={{
          maxWidth: 900,
          margin: "0 auto 32px auto",
          padding: "0 24px",
        }}
      >
        <h1
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: accent || C.t2,
            margin: 0,
            letterSpacing: "0.02em",
          }}
        >
          {activeRoom.label}
        </h1>
      </motion.div>

      {/* Sections */}
      <AnimatePresence mode="wait">
        {layout.sections.map((section, index) => {
          const blocks = sectionBlocks.get(section.id) || [];
          const isEmpty = blocks.length === 0;
          const Renderer = sectionRenderers[section.type];
          const isLast = index === layout.sections.length - 1 && unmatchedBlocks.length === 0;

          // Get empty label based on what the section accepts
          const emptyLabel = `Add ${section.accepts[0]?.replace(/_/g, " ") || "content"}`;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPF, delay: index * 0.1 }}
            >
              <SectionFrame
                title={section.title}
                divider={!isLast}
                isEmpty={isEmpty}
                emptyLabel={emptyLabel}
              >
                {!isEmpty && <Renderer blocks={blocks} accent={accent} />}
              </SectionFrame>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Unmatched blocks (Additional section) */}
      {unmatchedBlocks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPF, delay: layout.sections.length * 0.1 }}
        >
          <SectionFrame title="Additional" divider={false}>
            <AdditionalSection blocks={unmatchedBlocks} accent={accent} />
          </SectionFrame>
        </motion.div>
      )}
    </motion.div>
  );
}
