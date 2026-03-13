// ════════════════════════════════════════════════════════════════════════════
// Artefact Templates
// Preset configurations for different artefact types
// ════════════════════════════════════════════════════════════════════════════

import type { ArtefactTemplate, LayoutPreset } from "./types";

// ── Default Layout Presets ──────────────────────────────────────────────────

const STANDARD_PRESETS: LayoutPreset[] = [
  {
    id: "default",
    label: "Standard",
    sections: [
      { id: "hero", type: "hero", accepts: ["name", "title", "photo"] },
      { id: "identity", type: "identity", accepts: ["bio", "location"] },
      { id: "rooms", type: "rooms", accepts: ["*"], layout: "grid" },
    ],
  },
  {
    id: "minimal",
    label: "Minimal",
    sections: [
      { id: "hero", type: "hero", accepts: ["name", "title"] },
      { id: "content", type: "content", accepts: ["*"], layout: "stacked" },
    ],
  },
];

// ── Artefact Templates ──────────────────────────────────────────────────────

export const ARTEFACT_TEMPLATES: ArtefactTemplate[] = [
  {
    id: "portfolio",
    label: "Portfolio",
    description: "Personal portfolio for showcasing work and skills",
    rooms: [
      {
        id: "identity",
        label: "About",
        type: "about",
        shared: false,
        visibility: "public",
        blocks: [
          { id: "name", type: "text", label: "Name", prompt: "Your full name", required: true, layout: "headline", slideOrder: 0 },
          { id: "title", type: "text", label: "Title", prompt: "Your role or title", required: true, layout: "body", slideOrder: 1 },
          { id: "bio", type: "text", label: "Bio", prompt: "Short bio about yourself", required: true, layout: "body", slideOrder: 2 },
          { id: "location", type: "text", label: "Location", prompt: "Where you're based", required: false, layout: "body", slideOrder: 3 },
        ],
      },
      {
        id: "projects",
        label: "Projects",
        type: "projects",
        shared: false,
        visibility: "public",
        blocks: [
          { id: "project_1", type: "project", label: "Project 1", prompt: "Describe a key project", required: false, layout: "body", slideOrder: 0 },
          { id: "project_2", type: "project", label: "Project 2", prompt: "Describe another project", required: false, layout: "body", slideOrder: 1 },
          { id: "project_3", type: "project", label: "Project 3", prompt: "Describe another project", required: false, layout: "body", slideOrder: 2 },
        ],
      },
      {
        id: "skills",
        label: "Skills",
        type: "custom",
        shared: false,
        visibility: "public",
        blocks: [
          { id: "skills", type: "tags", label: "Skills", prompt: "List your key skills", required: false, layout: "body", slideOrder: 0 },
          { id: "tools", type: "tags", label: "Tools", prompt: "Tools you use", required: false, layout: "body", slideOrder: 1 },
        ],
      },
    ],
    presets: STANDARD_PRESETS,
    defaultPreset: "default",
  },
  {
    id: "founder",
    label: "Founder",
    description: "For startup founders in accelerators",
    rooms: [
      {
        id: "identity",
        label: "Founder",
        type: "about",
        shared: false,
        visibility: "public",
        blocks: [
          { id: "name", type: "text", label: "Name", prompt: "Your full name", required: true, layout: "headline", slideOrder: 0 },
          { id: "title", type: "text", label: "Title", prompt: "Your role (e.g. Founder & CEO)", required: true, layout: "body", slideOrder: 1 },
          { id: "bio", type: "text", label: "Bio", prompt: "Your background", required: true, layout: "body", slideOrder: 2 },
        ],
      },
      {
        id: "startup",
        label: "Startup",
        type: "projects",
        shared: true,
        visibility: "community",
        blocks: [
          { id: "startup_name", type: "text", label: "Company", prompt: "Startup name", required: true, layout: "headline", slideOrder: 0 },
          { id: "one_liner", type: "text", label: "One-liner", prompt: "What you do", required: true, layout: "body", slideOrder: 1 },
          { id: "stage", type: "text", label: "Stage", prompt: "Pre-seed, Seed, etc.", required: true, layout: "metric", slideOrder: 2 },
        ],
      },
      {
        id: "metrics",
        label: "Metrics",
        type: "metrics",
        shared: true,
        visibility: "private",
        blocks: [
          { id: "mrr", type: "metric", label: "MRR", prompt: "Monthly revenue", required: false, layout: "metric", slideOrder: 0 },
          { id: "users", type: "metric", label: "Users", prompt: "Active users", required: false, layout: "metric", slideOrder: 1 },
          { id: "growth", type: "metric", label: "Growth", prompt: "MoM growth %", required: false, layout: "metric", slideOrder: 2 },
        ],
      },
    ],
    presets: STANDARD_PRESETS,
    defaultPreset: "default",
  },
];

// ── Template Helpers ────────────────────────────────────────────────────────

export function getTemplate(id: string): ArtefactTemplate | undefined {
  return ARTEFACT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplateForRoom(
  roomId: string,
  roomType?: string
): ArtefactTemplate | undefined {
  return ARTEFACT_TEMPLATES.find((t) =>
    t.rooms.some((r) => r.id === roomId || r.type === roomType)
  );
}

export function getPresetOptions(templateId: string): Array<{ id: string; label: string }> {
  const template = getTemplate(templateId);
  if (!template) return [];
  return template.presets.map((p) => ({ id: p.id, label: p.label }));
}
