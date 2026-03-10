// ════════════════════════════════════════════════════════════════════════════
// P3: Output Compilation
// Transform artefact data into different output formats
// ════════════════════════════════════════════════════════════════════════════

import type { Identity, StandaloneRoom } from "@/types/artefact";
import type {
  StructuredBlockType,
  ProjectBlockContent,
  SkillBlockContent,
  ExperienceBlockContent,
  EducationBlockContent,
  MetricBlockContent,
  CertificationBlockContent,
} from "@/types/structured-blocks";

// ── Output Types ────────────────────────────────────────────────────────────

export type OutputFormat = "resume" | "portfolio" | "context" | "mcp";

// ── Resume View Model ───────────────────────────────────────────────────────

export type ResumeOutput = {
  format: "resume";
  identity: {
    name: string;
    title: string;
    email?: string;
    location?: string;
    links: { label: string; url: string }[];
  };
  summary?: string;
  experience: {
    title: string;
    organization: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    highlights: string[];
  }[];
  education: {
    institution: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }[];
  skills: {
    name: string;
    category?: string;
    level?: string;
  }[];
  certifications: {
    name: string;
    issuer: string;
    date?: string;
  }[];
  projects: {
    title: string;
    description?: string;
    url?: string;
    highlights: string[];
  }[];
};

// ── Portfolio View Model ────────────────────────────────────────────────────

export type PortfolioOutput = {
  format: "portfolio";
  identity: Identity;
  projects: {
    title: string;
    description?: string;
    role?: string;
    url?: string;
    image?: string;
    skills: string[];
    status?: string;
  }[];
  metrics: {
    label: string;
    value: string | number;
    unit?: string;
  }[];
  timeline: {
    title: string;
    date: string;
    type: string;
  }[];
};

// ── Context View Model (for AI consumption) ─────────────────────────────────

export type ContextOutput = {
  format: "context";
  version: "1.0";
  generatedAt: string;
  identity: Identity;
  rooms: {
    key: string;
    label: string;
    semantic: string;
    blocks: {
      type: string;
      content: Record<string, unknown>;
    }[];
  }[];
  skills: {
    name: string;
    level?: string;
    usageCount: number;
  }[];
  timeline: {
    title: string;
    date: string;
    type: string;
    source: string;
  }[];
  graph: {
    edges: {
      type: string;
      source: string;
      target: string;
      context?: string;
    }[];
  };
};

// ── MCP Resource Format ─────────────────────────────────────────────────────

export type MCPResource = {
  uri: string;
  name: string;
  description: string;
  mimeType: "application/json";
  contents: ContextOutput;
};

// ── Compiler Functions ──────────────────────────────────────────────────────

type BlockInput = {
  type: string;
  content: Record<string, unknown>;
};

type RoomInput = {
  key: string;
  label: string;
  semantic?: string;
  blocks: BlockInput[];
};

export type ArtefactData = {
  identity: Identity;
  rooms: RoomInput[];
  skills?: { name: string; level?: string; usage_count: number }[];
  timeline?: { title: string; date: string; type: string; source: string }[];
  edges?: { type: string; source: string; target: string; context?: string }[];
};

export function compileResume(data: ArtefactData): ResumeOutput {
  const experience: ResumeOutput["experience"] = [];
  const education: ResumeOutput["education"] = [];
  const skills: ResumeOutput["skills"] = [];
  const certifications: ResumeOutput["certifications"] = [];
  const projects: ResumeOutput["projects"] = [];
  let summary: string | undefined;

  for (const room of data.rooms) {
    for (const block of room.blocks) {
      const content = block.content as Record<string, unknown>;

      switch (block.type) {
        case "text":
          if (room.key === "about" && !summary) {
            summary = (content.body as string) || undefined;
          }
          break;

        case "experience":
          experience.push({
            title: (content as ExperienceBlockContent).title,
            organization: (content as ExperienceBlockContent).organization,
            location: (content as ExperienceBlockContent).location,
            startDate: (content as ExperienceBlockContent).startDate,
            endDate: (content as ExperienceBlockContent).endDate,
            current: (content as ExperienceBlockContent).current ?? false,
            highlights: (content as ExperienceBlockContent).highlights ?? [],
          });
          break;

        case "education":
          education.push({
            institution: (content as EducationBlockContent).institution,
            degree: (content as EducationBlockContent).degree,
            field: (content as EducationBlockContent).field,
            startDate: (content as EducationBlockContent).startDate,
            endDate: (content as EducationBlockContent).endDate,
          });
          break;

        case "skill":
          skills.push({
            name: (content as SkillBlockContent).name,
            category: (content as SkillBlockContent).category,
            level: (content as SkillBlockContent).level,
          });
          break;

        case "certification":
          certifications.push({
            name: (content as CertificationBlockContent).name,
            issuer: (content as CertificationBlockContent).issuer,
            date: (content as CertificationBlockContent).date,
          });
          break;

        case "project":
          projects.push({
            title: (content as ProjectBlockContent).title,
            description: (content as ProjectBlockContent).description,
            url: (content as ProjectBlockContent).url,
            highlights: (content as ProjectBlockContent).highlights ?? [],
          });
          break;
      }
    }
  }

  // Also add skills from aggregated view if available
  if (data.skills) {
    for (const skill of data.skills) {
      if (!skills.find((s) => s.name === skill.name)) {
        skills.push({ name: skill.name, level: skill.level });
      }
    }
  }

  return {
    format: "resume",
    identity: {
      name: data.identity.name,
      title: data.identity.title,
      email: data.identity.email,
      location: data.identity.location,
      links: data.identity.links,
    },
    summary,
    experience: experience.sort((a, b) =>
      (b.startDate || "").localeCompare(a.startDate || "")
    ),
    education: education.sort((a, b) =>
      (b.endDate || b.startDate || "").localeCompare(a.endDate || a.startDate || "")
    ),
    skills,
    certifications,
    projects,
  };
}

export function compilePortfolio(data: ArtefactData): PortfolioOutput {
  const projects: PortfolioOutput["projects"] = [];
  const metrics: PortfolioOutput["metrics"] = [];
  const timeline: PortfolioOutput["timeline"] = [];

  for (const room of data.rooms) {
    for (const block of room.blocks) {
      const content = block.content as Record<string, unknown>;

      switch (block.type) {
        case "project":
          projects.push({
            title: (content as ProjectBlockContent).title,
            description: (content as ProjectBlockContent).description,
            role: (content as ProjectBlockContent).role,
            url: (content as ProjectBlockContent).url,
            image: (content as ProjectBlockContent).image,
            skills: (content as ProjectBlockContent).skills ?? [],
            status: (content as ProjectBlockContent).status,
          });
          break;

        case "metric":
          metrics.push({
            label: (content as MetricBlockContent).label,
            value: (content as MetricBlockContent).value,
            unit: (content as MetricBlockContent).unit,
          });
          break;

        case "milestone":
          timeline.push({
            title: (content as { title: string }).title,
            date: (content as { date: string }).date,
            type: "milestone",
          });
          break;
      }
    }
  }

  // Add timeline from aggregated view
  if (data.timeline) {
    for (const item of data.timeline) {
      if (!timeline.find((t) => t.title === item.title && t.date === item.date)) {
        timeline.push({
          title: item.title,
          date: item.date,
          type: item.type,
        });
      }
    }
  }

  return {
    format: "portfolio",
    identity: data.identity,
    projects,
    metrics,
    timeline: timeline.sort((a, b) => b.date.localeCompare(a.date)),
  };
}

export function compileContext(data: ArtefactData, slug?: string): ContextOutput {
  return {
    format: "context",
    version: "1.0",
    generatedAt: new Date().toISOString(),
    identity: data.identity,
    rooms: data.rooms.map((room) => ({
      key: room.key,
      label: room.label,
      semantic: room.semantic ?? "custom",
      blocks: room.blocks.map((b) => ({
        type: b.type,
        content: b.content,
      })),
    })),
    skills: (data.skills ?? []).map((s) => ({
      name: s.name,
      level: s.level,
      usageCount: s.usage_count,
    })),
    timeline: (data.timeline ?? []).map((t) => ({
      title: t.title,
      date: t.date,
      type: t.type,
      source: t.source,
    })),
    graph: {
      edges: (data.edges ?? []).map((e) => ({
        type: e.type,
        source: e.source,
        target: e.target,
        context: e.context,
      })),
    },
  };
}

export function compileMCPResource(
  data: ArtefactData,
  slug: string
): MCPResource {
  return {
    uri: `artefact://${slug}`,
    name: data.identity.name || slug,
    description: `Professional context for ${data.identity.name || slug}`,
    mimeType: "application/json",
    contents: compileContext(data, slug),
  };
}

// ── Output Selection ────────────────────────────────────────────────────────

export function compile(
  data: ArtefactData,
  format: OutputFormat,
  slug?: string
): ResumeOutput | PortfolioOutput | ContextOutput | MCPResource {
  switch (format) {
    case "resume":
      return compileResume(data);
    case "portfolio":
      return compilePortfolio(data);
    case "context":
      return compileContext(data, slug);
    case "mcp":
      return compileMCPResource(data, slug ?? "unknown");
  }
}
