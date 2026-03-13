"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { TypingState } from "../types";

type UseGhostTypingOptions = {
  charDelay?: number;
  staggerDelay?: number;
};

/**
 * Generic ghost typing hook for wizard previews.
 * Animates content character by character for a typing effect.
 */
export function useGhostTyping(
  contentMap: Record<string, string>,
  options: UseGhostTypingOptions = {}
) {
  const { charDelay = 25, staggerDelay = 150 } = options;
  const [typingState, setTypingState] = useState<TypingState>({});
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Detect changes and start typing animations
  useEffect(() => {
    const newState: TypingState = {};
    const blocksToAnimate: string[] = [];

    for (const [blockId, target] of Object.entries(contentMap)) {
      const existing = typingState[blockId];
      if (!existing) {
        // New block - start typing
        newState[blockId] = { target, displayed: "", isTyping: true };
        blocksToAnimate.push(blockId);
      } else if (existing.target !== target) {
        // Content changed - restart typing
        newState[blockId] = { target, displayed: "", isTyping: true };
        blocksToAnimate.push(blockId);
      } else {
        // Keep existing state
        newState[blockId] = existing;
      }
    }

    if (blocksToAnimate.length > 0) {
      setTypingState(newState);

      // Clear old intervals for these blocks
      for (const blockId of blocksToAnimate) {
        const existing = intervalsRef.current.get(blockId);
        if (existing) clearInterval(existing);
      }

      // Start staggered typing for new blocks
      blocksToAnimate.forEach((blockId, idx) => {
        const delay = idx * staggerDelay;
        setTimeout(() => {
          const target = contentMap[blockId];
          if (!target) return;

          let charIdx = 0;
          const interval = setInterval(() => {
            charIdx++;
            setTypingState((prev) => {
              const current = prev[blockId];
              if (!current) return prev;
              if (charIdx >= target.length) {
                clearInterval(interval);
                intervalsRef.current.delete(blockId);
                return {
                  ...prev,
                  [blockId]: { ...current, displayed: target, isTyping: false },
                };
              }
              return {
                ...prev,
                [blockId]: { ...current, displayed: target.slice(0, charIdx) },
              };
            });
          }, charDelay);

          intervalsRef.current.set(blockId, interval);
        }, delay);
      });
    }

    // Cleanup intervals on unmount
    return () => {
      intervalsRef.current.forEach((interval) => clearInterval(interval));
    };
  }, [contentMap, charDelay, staggerDelay]); // eslint-disable-line react-hooks/exhaustive-deps

  const getDisplayedContent = useCallback(
    (blockId: string, fallback: string) => {
      const state = typingState[blockId];
      if (!state) return fallback;
      return state.displayed || (state.isTyping ? "" : fallback);
    },
    [typingState]
  );

  const isTyping = useCallback(
    (blockId: string) => typingState[blockId]?.isTyping ?? false,
    [typingState]
  );

  return { getDisplayedContent, isTyping };
}
