// ════════════════════════════════════════════════════════════════════════════
// Section Scaffolding Types
// 4-Layer Rendering System: Blocks → Templates → Sections → Page
// ════════════════════════════════════════════════════════════════════════════

// ── Page Template Identifiers ────────────────────────────────────────────────

export type PageTemplate =
  | "identity"
  | "startup"
  | "pitch"
  | "traction"
  | "timeline"
  | "team"
  | "portfolio"
  | "documents";

// ── Section Types ────────────────────────────────────────────────────────────

export type SectionType =
  | "hero"
  | "profile"
  | "metrics"
  | "gallery"
  | "timeline"
  | "documents"
  | "content"
  | "additional";

// ── Section Layout Options ───────────────────────────────────────────────────

export type SectionLayout = "stacked" | "grid" | "two-column";

// ── Section Configuration ────────────────────────────────────────────────────

export type SectionConfig = {
  id: string;
  type: SectionType;
  title?: string;
  accepts: string[]; // Block IDs that slot into this section
  layout?: SectionLayout;
};

// ── Layout Preset ────────────────────────────────────────────────────────────

export type LayoutPreset = {
  id: string;
  label: string;
  sections: SectionConfig[];
};

// ── Template Configuration ───────────────────────────────────────────────────

export type TemplateConfig = {
  id: PageTemplate;
  label: string;
  presets: LayoutPreset[];
  defaultPreset: string;
};

// ── Preview View Mode ────────────────────────────────────────────────────────

export type PreviewViewMode = "workspace" | "page";

// ── Block Data for Rendering ─────────────────────────────────────────────────

export type SectionBlock = {
  id: string;
  type: string;
  content: string;
  label?: string;
};

// ── Section Renderer Props ───────────────────────────────────────────────────

export type SectionRendererProps = {
  blocks: SectionBlock[];
  accent: string;
  layout?: SectionLayout;
};

// ── Section Frame Props ──────────────────────────────────────────────────────

export type SectionFrameVariant = "standard" | "hero";

export type SectionFrameProps = {
  title?: string;
  children: React.ReactNode;
  divider?: boolean;
  isEmpty?: boolean;
  emptyLabel?: string;
  variant?: SectionFrameVariant;
  showSeparator?: boolean;
};

// ── Page Composer Props ──────────────────────────────────────────────────────

export type PageComposerProps = {
  rooms: Array<{
    id: string;
    label: string;
    type: string;
    blocks: Array<{
      id: string;
      type: string;
      label: string;
    }>;
    preset?: string;
  }>;
  getBlockContent: (blockId: string) => string;
  accent: string;
  activeRoomId?: string;
};

// ── View Toggle Props ────────────────────────────────────────────────────────

export type ViewToggleProps = {
  mode: PreviewViewMode;
  onChange: (mode: PreviewViewMode) => void;
};
