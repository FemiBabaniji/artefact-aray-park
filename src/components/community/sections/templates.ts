// ════════════════════════════════════════════════════════════════════════════
// Page Templates Configuration
// 8 templates with 3 presets each
// ════════════════════════════════════════════════════════════════════════════

import type { TemplateConfig, PageTemplate } from "./types";

// ── Identity Template ────────────────────────────────────────────────────────
// Hero/Profile layout with photo, name, title, bio, links

const identityTemplate: TemplateConfig = {
  id: "identity",
  label: "Identity",
  defaultPreset: "classic",
  presets: [
    {
      id: "classic",
      label: "Classic",
      sections: [
        { id: "hero", type: "profile", accepts: ["name", "bio", "photo", "title", "location"] },
        { id: "links", type: "content", title: "Connect", accepts: ["links", "website", "linkedin", "twitter"] },
      ],
    },
    {
      id: "bold",
      label: "Bold",
      sections: [
        { id: "hero", type: "hero", accepts: ["photo", "name"] },
        { id: "about", type: "content", title: "About", accepts: ["bio", "title", "location"] },
        { id: "links", type: "gallery", accepts: ["links", "website", "linkedin", "twitter"], layout: "grid" },
      ],
    },
    {
      id: "minimal",
      label: "Minimal",
      sections: [
        { id: "profile", type: "profile", accepts: ["name", "title", "bio", "photo", "links"] },
      ],
    },
  ],
};

// ── Startup Template ─────────────────────────────────────────────────────────
// Landing page with name, tagline, problem, solution, demo

const startupTemplate: TemplateConfig = {
  id: "startup",
  label: "Startup",
  defaultPreset: "landing",
  presets: [
    {
      id: "landing",
      label: "Landing",
      sections: [
        { id: "hero", type: "hero", accepts: ["startup_name", "one_liner", "logo"] },
        { id: "overview", type: "content", title: "Overview", accepts: ["description", "overview"] },
        { id: "stage", type: "metrics", accepts: ["stage", "founded", "team_size"] },
      ],
    },
    {
      id: "pitch",
      label: "Pitch Style",
      sections: [
        { id: "header", type: "hero", accepts: ["startup_name", "one_liner"] },
        { id: "problem", type: "content", title: "The Problem", accepts: ["problem"] },
        { id: "solution", type: "content", title: "Our Solution", accepts: ["solution", "description"] },
        { id: "info", type: "metrics", accepts: ["stage", "logo"] },
      ],
    },
    {
      id: "minimal",
      label: "Minimal",
      sections: [
        { id: "main", type: "profile", accepts: ["startup_name", "one_liner", "logo", "stage"] },
      ],
    },
  ],
};

// ── Pitch Template ───────────────────────────────────────────────────────────
// Multi-section narrative with problem, solution, market, traction, ask

const pitchTemplate: TemplateConfig = {
  id: "pitch",
  label: "Pitch",
  defaultPreset: "investor",
  presets: [
    {
      id: "investor",
      label: "Investor",
      sections: [
        { id: "hero", type: "hero", accepts: ["startup_name", "one_liner", "logo"] },
        { id: "problem", type: "content", title: "The Problem", accepts: ["problem"] },
        { id: "solution", type: "content", title: "The Solution", accepts: ["solution"] },
        { id: "market", type: "content", title: "Market", accepts: ["market"] },
        { id: "product", type: "content", title: "Product", accepts: ["product", "demo"] },
        { id: "traction", type: "metrics", title: "Traction", accepts: ["traction", "mrr", "users", "growth"] },
        { id: "ask", type: "content", title: "The Ask", accepts: ["ask", "funding"] },
      ],
    },
    {
      id: "narrative",
      label: "Narrative",
      sections: [
        { id: "intro", type: "content", accepts: ["problem", "startup_name"] },
        { id: "story", type: "content", title: "Our Story", accepts: ["solution", "market"] },
        { id: "demo", type: "content", title: "See It In Action", accepts: ["product", "demo"] },
        { id: "proof", type: "metrics", title: "The Numbers", accepts: ["traction", "mrr", "users", "growth"] },
        { id: "close", type: "content", title: "Join Us", accepts: ["ask"] },
      ],
    },
    {
      id: "minimal",
      label: "Minimal",
      sections: [
        { id: "pitch", type: "content", accepts: ["problem", "solution"] },
        { id: "traction", type: "metrics", accepts: ["traction", "mrr", "users", "growth"] },
        { id: "ask", type: "content", accepts: ["ask", "market"] },
      ],
    },
  ],
};

// ── Traction Template ────────────────────────────────────────────────────────
// Statistics grid with metric cards, testimonials, logos

const tractionTemplate: TemplateConfig = {
  id: "traction",
  label: "Traction",
  defaultPreset: "dashboard",
  presets: [
    {
      id: "dashboard",
      label: "Dashboard",
      sections: [
        { id: "headline", type: "content", accepts: ["headline", "summary"] },
        { id: "metrics", type: "metrics", title: "Key Metrics", accepts: ["mrr", "arr", "users", "growth", "revenue", "customers"], layout: "grid" },
        { id: "testimonials", type: "gallery", title: "What People Say", accepts: ["testimonials", "quotes", "logos"] },
      ],
    },
    {
      id: "highlights",
      label: "Highlights",
      sections: [
        { id: "hero", type: "hero", accepts: ["mrr", "users"] },
        { id: "details", type: "metrics", accepts: ["growth", "arr", "revenue", "customers"] },
        { id: "proof", type: "content", title: "Social Proof", accepts: ["testimonials", "logos"] },
      ],
    },
    {
      id: "minimal",
      label: "Minimal",
      sections: [
        { id: "stats", type: "metrics", accepts: ["mrr", "arr", "users", "growth", "revenue"] },
      ],
    },
  ],
};

// ── Timeline Template ────────────────────────────────────────────────────────
// Vertical timeline with milestones

const timelineTemplate: TemplateConfig = {
  id: "timeline",
  label: "Timeline",
  defaultPreset: "journey",
  presets: [
    {
      id: "journey",
      label: "Journey",
      sections: [
        { id: "intro", type: "content", title: "Our Journey", accepts: ["intro", "summary"] },
        { id: "milestones", type: "timeline", accepts: ["milestone_1", "milestone_2", "milestone_3", "milestone_4", "milestone_5", "milestones"] },
      ],
    },
    {
      id: "roadmap",
      label: "Roadmap",
      sections: [
        { id: "past", type: "timeline", title: "What We've Built", accepts: ["milestone_1", "milestone_2", "milestone_3"] },
        { id: "future", type: "timeline", title: "What's Next", accepts: ["milestone_4", "milestone_5", "roadmap"] },
      ],
    },
    {
      id: "minimal",
      label: "Minimal",
      sections: [
        { id: "timeline", type: "timeline", accepts: ["milestone_1", "milestone_2", "milestone_3", "milestone_4", "milestone_5", "milestones"] },
      ],
    },
  ],
};

// ── Team Template ────────────────────────────────────────────────────────────
// Profile cards grid for team members and collaborators

const teamTemplate: TemplateConfig = {
  id: "team",
  label: "Team",
  defaultPreset: "grid",
  presets: [
    {
      id: "grid",
      label: "Grid",
      sections: [
        { id: "intro", type: "content", title: "Meet the Team", accepts: ["intro", "about"] },
        { id: "founders", type: "gallery", title: "Founders", accepts: ["founder_1", "founder_2", "founders", "cofounder"], layout: "grid" },
        { id: "advisors", type: "gallery", title: "Advisors", accepts: ["advisor_1", "advisor_2", "advisors", "mentors"], layout: "grid" },
      ],
    },
    {
      id: "featured",
      label: "Featured",
      sections: [
        { id: "lead", type: "profile", accepts: ["founder_1", "ceo"] },
        { id: "team", type: "gallery", title: "Team", accepts: ["founder_2", "founders", "cofounder", "team"], layout: "grid" },
        { id: "network", type: "gallery", title: "Our Network", accepts: ["advisors", "mentors", "investors"] },
      ],
    },
    {
      id: "minimal",
      label: "Minimal",
      sections: [
        { id: "team", type: "gallery", accepts: ["founder_1", "founder_2", "founders", "cofounder", "advisors", "team"], layout: "grid" },
      ],
    },
  ],
};

// ── Portfolio Template ───────────────────────────────────────────────────────
// Gallery/case study cards for projects

const portfolioTemplate: TemplateConfig = {
  id: "portfolio",
  label: "Portfolio",
  defaultPreset: "showcase",
  presets: [
    {
      id: "showcase",
      label: "Showcase",
      sections: [
        { id: "intro", type: "content", title: "Our Work", accepts: ["intro", "about"] },
        { id: "featured", type: "gallery", title: "Featured Projects", accepts: ["project_1", "project_2", "featured"], layout: "grid" },
        { id: "other", type: "gallery", title: "More Work", accepts: ["project_3", "project_4", "projects"], layout: "grid" },
      ],
    },
    {
      id: "case-studies",
      label: "Case Studies",
      sections: [
        { id: "project_1", type: "content", title: "Case Study 1", accepts: ["project_1", "case_1"] },
        { id: "project_2", type: "content", title: "Case Study 2", accepts: ["project_2", "case_2"] },
        { id: "more", type: "gallery", accepts: ["project_3", "project_4", "projects"] },
      ],
    },
    {
      id: "minimal",
      label: "Minimal",
      sections: [
        { id: "projects", type: "gallery", accepts: ["project_1", "project_2", "project_3", "project_4", "projects", "featured"], layout: "grid" },
      ],
    },
  ],
};

// ── Documents Template ───────────────────────────────────────────────────────
// Document library with file cards

const documentsTemplate: TemplateConfig = {
  id: "documents",
  label: "Documents",
  defaultPreset: "library",
  presets: [
    {
      id: "library",
      label: "Library",
      sections: [
        { id: "main", type: "documents", title: "Key Documents", accepts: ["deck", "pitch_deck", "one_pager", "financials"] },
        { id: "other", type: "documents", title: "Additional Resources", accepts: ["appendix", "reports", "documents", "files"] },
      ],
    },
    {
      id: "featured",
      label: "Featured",
      sections: [
        { id: "pitch", type: "content", title: "Pitch Deck", accepts: ["deck", "pitch_deck"] },
        { id: "summary", type: "content", title: "One Pager", accepts: ["one_pager", "summary"] },
        { id: "more", type: "documents", title: "More Documents", accepts: ["financials", "appendix", "reports", "documents"] },
      ],
    },
    {
      id: "minimal",
      label: "Minimal",
      sections: [
        { id: "docs", type: "documents", accepts: ["deck", "pitch_deck", "one_pager", "financials", "documents", "files"] },
      ],
    },
  ],
};

// ── Template Registry ────────────────────────────────────────────────────────

export const templates: Record<PageTemplate, TemplateConfig> = {
  identity: identityTemplate,
  startup: startupTemplate,
  pitch: pitchTemplate,
  traction: tractionTemplate,
  timeline: timelineTemplate,
  team: teamTemplate,
  portfolio: portfolioTemplate,
  documents: documentsTemplate,
};

// ── Helper: Get template by room ID or type ──────────────────────────────────

type RoomSemantic = "about" | "projects" | "metrics" | "timeline" | "network" | "custom";

const roomIdToTemplate: Record<string, PageTemplate> = {
  identity: "identity",
  startup: "startup",
  pitch: "pitch",
  traction: "traction",
  documents: "documents",
  milestones: "timeline",
  team: "team",
  portfolio: "portfolio",
};

const semanticToTemplate: Record<RoomSemantic, PageTemplate> = {
  about: "identity",
  projects: "portfolio",
  metrics: "traction",
  timeline: "timeline",
  network: "team",
  custom: "pitch",
};

export function getTemplateForRoom(roomId: string, roomType?: string): TemplateConfig {
  // First try direct room ID match
  if (roomIdToTemplate[roomId]) {
    return templates[roomIdToTemplate[roomId]];
  }

  // Then try semantic type match
  if (roomType && semanticToTemplate[roomType as RoomSemantic]) {
    return templates[semanticToTemplate[roomType as RoomSemantic]];
  }

  // Default to pitch template for custom/unknown
  return templates.pitch;
}

export function getPresetOptions(templateId: PageTemplate): Array<{ id: string; label: string }> {
  const template = templates[templateId];
  return template.presets.map((p) => ({ id: p.id, label: p.label }));
}

// ── Infer Template from StandaloneRoom ────────────────────────────────────────

type InferableRoom = {
  key: string;
  label: string;
  blocks: Array<{ blockType: string }>;
};

/**
 * Infers the appropriate page template from a room's key, label, and block content.
 * Used to apply section-based rendering to artefact pages.
 */
export function inferTemplateFromRoom(room: InferableRoom): PageTemplate {
  const key = room.key.toLowerCase();
  const label = room.label.toLowerCase();

  // 1. Direct key match
  if (roomIdToTemplate[key]) {
    return roomIdToTemplate[key];
  }

  // 2. Infer from block types present
  const blockTypes = room.blocks.map((b) => b.blockType);

  if (blockTypes.includes("metric")) return "traction";
  if (blockTypes.includes("milestone")) return "timeline";
  if (blockTypes.includes("project")) return "portfolio";
  if (blockTypes.includes("experience") || blockTypes.includes("education")) return "identity";
  if (blockTypes.includes("relationship")) return "team";
  if (blockTypes.includes("document")) return "documents";

  // 3. Fuzzy match on label
  if (label.includes("identity") || label.includes("about") || label.includes("profile")) return "identity";
  if (label.includes("startup") || label.includes("company")) return "startup";
  if (label.includes("pitch")) return "pitch";
  if (label.includes("traction") || label.includes("metric") || label.includes("number")) return "traction";
  if (label.includes("timeline") || label.includes("milestone") || label.includes("journey")) return "timeline";
  if (label.includes("team") || label.includes("people") || label.includes("network")) return "team";
  if (label.includes("project") || label.includes("portfolio") || label.includes("work")) return "portfolio";
  if (label.includes("document") || label.includes("deck") || label.includes("file")) return "documents";

  // 4. Default to pitch (narrative content)
  return "pitch";
}

/**
 * Checks if a room should render with a hero band (full-width header).
 * Returns true for identity-style rooms that benefit from hero treatment.
 */
export function shouldRenderHeroBand(room: InferableRoom): boolean {
  const template = inferTemplateFromRoom(room);
  return template === "identity" || template === "startup";
}
