"use client";

import { useState } from "react";
import { useC, useTheme } from "@/hooks/useC";
import { CompactCard, ExpandedArtefact, useCardColors } from "@/components/artefact";
import { MockArtefactProvider } from "./MockArtefactProvider";
import type { StandaloneRoom, Identity } from "@/types/artefact";

type ArtefactPreviewPanelProps = {
  rooms: StandaloneRoom[];
  identity: Identity;
  showExpanded?: boolean;
  focusedRoomId?: string | null;
  fullscreen?: boolean;
  /** Hide editing controls for preview-only mode */
  readOnly?: boolean;
};

function ArtefactPreviewInner({
  accent,
  cardBg,
  colorId,
  onColorChange,
  theme,
  dark,
  onToggleTheme,
  autoShowRoom,
  fullscreen,
  readOnly,
}: {
  accent: string;
  cardBg: string;
  colorId: string;
  onColorChange: (id: string) => void;
  theme: ReturnType<typeof useCardColors>;
  dark: boolean;
  onToggleTheme: () => void;
  autoShowRoom?: boolean;
  fullscreen?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div style={fullscreen ? { width: "100%", height: "100%", display: "flex", flexDirection: "column" } : { transform: "scale(0.65)", transformOrigin: "center center" }}>
      <ExpandedArtefact
        accent={accent}
        cardBg={cardBg}
        colorId={colorId}
        onColorChange={onColorChange}
        onCollapse={() => {}}
        theme={theme}
        dark={dark}
        onToggleTheme={onToggleTheme}
        autoShowRoom={autoShowRoom}
        fillContainer={fullscreen}
        readOnly={readOnly}
      />
    </div>
  );
}

/**
 * Reusable artefact preview panel for wizards.
 * Shows CompactCard by default, ExpandedArtefact when showExpanded is true.
 */
export function ArtefactPreviewPanel({
  rooms,
  identity,
  showExpanded = false,
  focusedRoomId,
  fullscreen = false,
  readOnly = true,
}: ArtefactPreviewPanelProps) {
  const C = useC();
  const { dark, toggle: toggleTheme } = useTheme();
  const theme = useCardColors(C);
  const [colorId, setColorId] = useState(theme.isDark ? "indigo" : "magenta");

  const colorExists = theme.colors.some((c) => c.id === colorId);
  const effectiveColorId = colorExists ? colorId : theme.isDark ? "indigo" : "magenta";
  const cc = theme.colors.find((c) => c.id === effectiveColorId) || theme.colors[0];

  if (showExpanded) {
    return (
      <MockArtefactProvider rooms={rooms} identity={identity} focusedRoomId={focusedRoomId}>
        <ArtefactPreviewInner
          accent={cc.accent}
          cardBg={cc.card}
          colorId={colorId}
          onColorChange={setColorId}
          theme={theme}
          dark={dark}
          onToggleTheme={toggleTheme}
          autoShowRoom={!!focusedRoomId}
          fullscreen={fullscreen}
          readOnly={readOnly}
        />
      </MockArtefactProvider>
    );
  }

  return (
    <CompactCard
      identity={identity}
      rooms={rooms}
      accent={cc.accent}
      cardBg={cc.card}
      onExpand={() => {}}
      onShowOutputs={() => {}}
      colorId={colorId}
      onColorChange={setColorId}
      theme={theme}
      dark={dark}
      onToggleTheme={toggleTheme}
    />
  );
}
