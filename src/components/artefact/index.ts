// ════════════════════════════════════════════════════════════════════════════
// Artefact System
// Unified component system for artefact rendering
// ════════════════════════════════════════════════════════════════════════════

// Views (types, templates, renderers)
export * from "./views";

// Hooks
export * from "./hooks";

// Modals
export * from "./modals";

// ── Legacy component (to be deprecated) ─────────────────────────────────────
export { Artefact } from "./Artefact";
export { LinkPreviewGrid } from "./LinkPreview";

// ── Compatibility aliases (map old names to new renderers) ──────────────────
export { CompactRenderer as CompactCard } from "./views/renderers/CompactRenderer";
export { ExpandedRenderer as ExpandedArtefact } from "./views/renderers/ExpandedRenderer";

// ── Re-exports from create/ (main entry points) ─────────────────────────────
export { CreatePortal as ArtefactWizard } from "@/components/create/CreatePortal";
export { PublicArtefactView } from "@/components/create/PublicArtefactView";
