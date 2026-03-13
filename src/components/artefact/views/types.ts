// ════════════════════════════════════════════════════════════════════════════
// Artefact View Types
// 4-Layer Rendering System: Blocks → Templates → Views → Artefact
// ════════════════════════════════════════════════════════════════════════════

import type { Block } from "@/types/room";
import type { Identity as CanonicalIdentity, StandaloneRoom } from "@/types/artefact";

// Re-export canonical types for consumers
export type { StandaloneRoom };
export type Identity = CanonicalIdentity;

// ── View Mode ───────────────────────────────────────────────────────────────

export type ArtefactViewMode = "compact" | "expanded" | "drill" | "page";

export type PreviewViewMode = "workspace" | "page";

// ── Card Theme ──────────────────────────────────────────────────────────────

export type CardTheme = {
  isDark: boolean;
  colors: Array<{ id: string; accent: string; card: string }>;
  outerText: string;
  innerTextPrimary: string;
  innerTextSecondary: string;
  cardShadow: (accent: string) => string;
};

// ── Room Types (view-layer, compatible with StandaloneRoom) ─────────────────

export type RoomSemantic = "about" | "projects" | "metrics" | "timeline" | "custom";

export type RoomVisibility = "public" | "private" | "unlisted" | "community";

export type Room = {
  id: string;
  key?: string;
  label: string;
  type?: RoomSemantic;
  prompt?: string;
  blocks: Block[];
  visibility?: RoomVisibility;
  orderIndex?: number;
  preset?: string;
};

// ── Block Layout ────────────────────────────────────────────────────────────

export type BlockLayout = "headline" | "body" | "metric" | "media" | "two-column" | "bullet";

export type BlockTemplate = {
  id: string;
  type: string;
  label: string;
  prompt: string;
  required: boolean;
  layout: BlockLayout;
  slideOrder: number;
};

// ── Room Template ───────────────────────────────────────────────────────────

export type RoomTemplate = {
  id: string;
  label: string;
  type: RoomSemantic;
  shared: boolean;
  visibility: RoomVisibility;
  blocks: BlockTemplate[];
  preset?: string;
};

// ── View Section Types ──────────────────────────────────────────────────────

export type ViewSectionType =
  | "hero"
  | "identity"
  | "rooms"
  | "metrics"
  | "gallery"
  | "timeline"
  | "content";

export type ViewSectionLayout = "stacked" | "grid" | "two-column";

export type ViewSectionConfig = {
  id: string;
  type: ViewSectionType;
  title?: string;
  accepts: string[];
  layout?: ViewSectionLayout;
};

// ── Layout Preset ───────────────────────────────────────────────────────────

export type LayoutPreset = {
  id: string;
  label: string;
  sections: ViewSectionConfig[];
};

// ── Template Configuration ──────────────────────────────────────────────────

export type ArtefactTemplate = {
  id: string;
  label: string;
  description: string;
  rooms: RoomTemplate[];
  presets: LayoutPreset[];
  defaultPreset: string;
};

// ── Renderer Props ──────────────────────────────────────────────────────────

export type CompactRendererProps = {
  identity: Identity;
  rooms: Room[];
  accent: string;
  cardBg: string;
  theme: CardTheme;
  dark: boolean;
  colorId: string;
  onColorChange: (id: string) => void;
  onToggleTheme: () => void;
  onExpand: () => void;
  onShowOutputs?: () => void;
  readOnly?: boolean;
  size?: "default" | "mini";
};

export type ExpandedRendererProps = {
  accent: string;
  cardBg: string;
  theme: CardTheme;
  dark: boolean;
  colorId: string;
  onColorChange: (id: string) => void;
  onToggleTheme: () => void;
  onCollapse: () => void;
  readOnly?: boolean;
  fillContainer?: boolean;
  autoShowRoom?: boolean;
};

export type DrillRendererProps = {
  rooms: Room[];
  activeRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  onClose: () => void;
  accent: string;
  theme: CardTheme;
};

// ── Artefact Frame Props ────────────────────────────────────────────────────

export type ArtefactFrameVariant = "standard" | "compact" | "expanded";

export type ArtefactFrameProps = {
  title?: string;
  children: React.ReactNode;
  variant?: ArtefactFrameVariant;
  divider?: boolean;
  isEmpty?: boolean;
  emptyLabel?: string;
};

// ── Composer Props ──────────────────────────────────────────────────────────

export type ArtefactComposerProps = {
  identity: Identity;
  rooms: Room[];
  getBlockContent: (blockId: string) => string;
  accent: string;
  activeRoomId?: string;
  mode?: ArtefactViewMode;
};

// ── View Toggle Props ───────────────────────────────────────────────────────

export type ViewToggleProps = {
  mode: PreviewViewMode;
  onChange: (mode: PreviewViewMode) => void;
};
