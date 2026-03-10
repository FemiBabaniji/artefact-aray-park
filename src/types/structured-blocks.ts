// ════════════════════════════════════════════════════════════════════════════
// P1: Structured Block Types
// Typed content schemas for semantic blocks
// ════════════════════════════════════════════════════════════════════════════

// ── Block Type Enum ─────────────────────────────────────────────────────────

export type StructuredBlockType =
  | "text"
  | "image"
  | "link"
  | "embed"
  | "metric"
  | "milestone"
  | "project"
  | "skill"
  | "experience"
  | "education"
  | "certification"
  | "relationship";

// ── Room Semantic ───────────────────────────────────────────────────────────

export type RoomSemantic =
  | "about"
  | "projects"
  | "skills"
  | "experience"
  | "education"
  | "timeline"
  | "metrics"
  | "network"
  | "custom";

// ── Edge Types ──────────────────────────────────────────────────────────────

export type EdgeType =
  | "worked_on"
  | "learned"
  | "collaborated_with"
  | "employed_by"
  | "studied_at"
  | "mentored_by"
  | "uses_tool"
  | "related_to";

// ── Content Schemas ─────────────────────────────────────────────────────────

export type TextBlockContent = {
  body: string;
  format?: "markdown" | "html";
};

export type ImageBlockContent = {
  url?: string;
  storagePath?: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type LinkBlockContent = {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
};

export type EmbedBlockContent = {
  url: string;
  provider?: string;
  html?: string;
  aspectRatio?: number;
};

export type MetricBlockContent = {
  value: number | string;
  label: string;
  unit?: string;
  change?: number;
  period?: string;
  format?: "number" | "currency" | "percent";
};

export type MilestoneBlockContent = {
  title: string;
  date: string;
  description?: string;
  type?: "achievement" | "release" | "event" | "award";
  icon?: string;
};

export type ProjectBlockContent = {
  title: string;
  description?: string;
  role?: string;
  url?: string;
  image?: string;
  startDate?: string;
  endDate?: string;
  status?: "completed" | "in_progress" | "planned";
  skills?: string[];
  highlights?: string[];
  metrics?: { label: string; value: string }[];
};

export type SkillBlockContent = {
  name: string;
  level?: "beginner" | "intermediate" | "advanced" | "expert";
  years?: number;
  category?: string;
  endorsed?: boolean;
  icon?: string;
};

export type ExperienceBlockContent = {
  title: string;
  organization: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  highlights?: string[];
  skills?: string[];
};

export type EducationBlockContent = {
  institution: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  highlights?: string[];
};

export type CertificationBlockContent = {
  name: string;
  issuer: string;
  date?: string;
  expires?: string;
  credentialId?: string;
  url?: string;
};

export type RelationshipBlockContent = {
  personName: string;
  personTitle?: string;
  personOrg?: string;
  relationship: string;
  context?: string;
  url?: string;
  avatar?: string;
};

// ── Block Content Union ─────────────────────────────────────────────────────

export type BlockContent =
  | { type: "text"; data: TextBlockContent }
  | { type: "image"; data: ImageBlockContent }
  | { type: "link"; data: LinkBlockContent }
  | { type: "embed"; data: EmbedBlockContent }
  | { type: "metric"; data: MetricBlockContent }
  | { type: "milestone"; data: MilestoneBlockContent }
  | { type: "project"; data: ProjectBlockContent }
  | { type: "skill"; data: SkillBlockContent }
  | { type: "experience"; data: ExperienceBlockContent }
  | { type: "education"; data: EducationBlockContent }
  | { type: "certification"; data: CertificationBlockContent }
  | { type: "relationship"; data: RelationshipBlockContent };

// ── Graph Edge ──────────────────────────────────────────────────────────────

export type GraphEdge = {
  id: string;
  artefactId: string;
  edgeType: EdgeType;
  sourceType: "block" | "identity" | "milestone";
  sourceId: string;
  targetType: "block" | "skill" | "project" | "person" | "org";
  targetId?: string;
  targetRef?: string;
  weight?: number;
  context?: string;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, unknown>;
};

// ── Structured Block ────────────────────────────────────────────────────────

export type StructuredBlock = {
  id: string;
  roomId: string;
  type: StructuredBlockType;
  content: BlockContent["data"];
  orderIndex: number;
  createdAt?: string;
  // Graph edges originating from this block
  edges?: GraphEdge[];
};

// ── Structured Room ─────────────────────────────────────────────────────────

export type StructuredRoom = {
  id: string;
  artefactId: string;
  key: string;
  label: string;
  prompt?: string;
  semantic: RoomSemantic;
  visibility: "public" | "private" | "unlisted";
  orderIndex: number;
  blocks: StructuredBlock[];
};

// ── Type Guards ─────────────────────────────────────────────────────────────

export function isProjectBlock(block: StructuredBlock): block is StructuredBlock & { content: ProjectBlockContent } {
  return block.type === "project";
}

export function isSkillBlock(block: StructuredBlock): block is StructuredBlock & { content: SkillBlockContent } {
  return block.type === "skill";
}

export function isExperienceBlock(block: StructuredBlock): block is StructuredBlock & { content: ExperienceBlockContent } {
  return block.type === "experience";
}

export function isEducationBlock(block: StructuredBlock): block is StructuredBlock & { content: EducationBlockContent } {
  return block.type === "education";
}

export function isMilestoneBlock(block: StructuredBlock): block is StructuredBlock & { content: MilestoneBlockContent } {
  return block.type === "milestone";
}

export function isMetricBlock(block: StructuredBlock): block is StructuredBlock & { content: MetricBlockContent } {
  return block.type === "metric";
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getBlockIcon(type: StructuredBlockType): string {
  const icons: Record<StructuredBlockType, string> = {
    text: "T",
    image: "\u25A3",
    link: "\u2197",
    embed: "\u25B6",
    metric: "#",
    milestone: "\u2605",
    project: "\u25A6",
    skill: "\u2713",
    experience: "\u2261",
    education: "\u2302",
    certification: "\u2713",
    relationship: "\u2194",
  };
  return icons[type] || "\u25A1";
}

export function getBlockLabel(type: StructuredBlockType): string {
  const labels: Record<StructuredBlockType, string> = {
    text: "Text",
    image: "Image",
    link: "Link",
    embed: "Embed",
    metric: "Metric",
    milestone: "Milestone",
    project: "Project",
    skill: "Skill",
    experience: "Experience",
    education: "Education",
    certification: "Certification",
    relationship: "Relationship",
  };
  return labels[type] || type;
}

export function getRoomSemanticIcon(semantic: RoomSemantic): string {
  const icons: Record<RoomSemantic, string> = {
    about: "\u2139",
    projects: "\u25A6",
    skills: "\u2713",
    experience: "\u2261",
    education: "\u2302",
    timeline: "\u21A6",
    metrics: "#",
    network: "\u2194",
    custom: "\u25A1",
  };
  return icons[semantic] || "\u25A1";
}

// ── Default Content Factories ───────────────────────────────────────────────

export const createDefaultContent: Record<StructuredBlockType, () => BlockContent["data"]> = {
  text: () => ({ body: "", format: "markdown" } as TextBlockContent),
  image: () => ({} as ImageBlockContent),
  link: () => ({ url: "" } as LinkBlockContent),
  embed: () => ({ url: "" } as EmbedBlockContent),
  metric: () => ({ value: 0, label: "" } as MetricBlockContent),
  milestone: () => ({ title: "", date: new Date().toISOString().split("T")[0] } as MilestoneBlockContent),
  project: () => ({ title: "", status: "in_progress" } as ProjectBlockContent),
  skill: () => ({ name: "", level: "intermediate" } as SkillBlockContent),
  experience: () => ({ title: "", organization: "", startDate: "" } as ExperienceBlockContent),
  education: () => ({ institution: "" } as EducationBlockContent),
  certification: () => ({ name: "", issuer: "" } as CertificationBlockContent),
  relationship: () => ({ personName: "", relationship: "" } as RelationshipBlockContent),
};

// ── Room Semantic to Suggested Block Types ──────────────────────────────────

export const semanticBlockTypes: Record<RoomSemantic, StructuredBlockType[]> = {
  about: ["text", "image", "link"],
  projects: ["project", "image", "link", "embed"],
  skills: ["skill", "certification"],
  experience: ["experience"],
  education: ["education", "certification"],
  timeline: ["milestone", "project", "experience"],
  metrics: ["metric"],
  network: ["relationship"],
  custom: ["text", "image", "link", "embed", "metric", "project", "skill", "experience"],
};
