// ============================================================================
// Render Layer Types
// Composable presentation for engagement artefacts
// ============================================================================

// Render intents - what the render is for
export type RenderIntent =
  | "client_portal"
  | "pitch_deck"
  | "board_summary"
  | "handover_doc"
  | "demo_render"
  | "weekly_update"
  | "monthly_report"
  | "quarterly_review"
  | "board_prep"
  | "steering_update"
  | "session_recap"
  | "relationship_summary"
  | "exec_presentation"
  | "final_report"
  | "project_close"
  | "implementation_guide"
  | "custom";

// Mask annotation for sensitive data
export type MaskAnnotation = {
  start: number;
  end: number;
  placeholder: string;
};

// Room selection for a render
export type RenderRoomSelection = {
  roomId: string;
  roomKey: string;
  included: boolean;
  template?: string; // e.g., "pitch", "minimal", "timeline"
  preset?: string;   // e.g., "dashboard", "journey"
};

// Render configuration
export type RenderConfig = {
  intent: RenderIntent;
  showFeaturedOnly: boolean;
  masks?: {
    clientName?: string;
    participantNames?: string[];
    figures?: "pattern" | "redact" | "none"; // $XX,XXX, XX%
    applyManualMasks?: boolean;
  };
  sequence?: string[]; // Room keys in order
};

// Intent defaults for quick configuration
export type IntentDefaults = {
  name: string;
  description: string;
  rooms: string[]; // Room keys to include
  showFeaturedOnly: boolean;
  defaultMasks?: RenderConfig["masks"];
};

// Named render (saved per engagement)
export type EngagementRender = {
  id: string;
  engagementId: string;
  name: string;
  intent: RenderIntent;
  roomSelections: RenderRoomSelection[];
  renderConfig: RenderConfig;
  shareToken?: string;
  sharedAt?: string;
  sharePassword?: string;
  forkedFromTemplateId?: string;
  createdAt: string;
  updatedAt: string;
};

// Render template (platform or practice level)
export type RenderTemplate = {
  id: string;
  ownerId?: string; // null = platform template
  practiceId?: string;
  name: string;
  slug?: string;
  description?: string;
  engagementType?: EngagementType;
  roomSchema: RoomSchema[];
  renderIntents: Record<string, IntentDefaults>;
  blockGuidance?: Record<string, string[]>; // roomKey -> suggested block types
  maskPatterns?: RenderConfig["masks"];
  visibility: "private" | "practice" | "public";
  forkCount: number;
  forkedFrom?: string;
  createdAt: string;
  updatedAt: string;
};

// Room schema in template
export type RoomSchema = {
  key: string;
  label: string;
  visibility: "consultant_only" | "client_view" | "client_edit";
  required: boolean;
  prompt?: string;
};

// Engagement types that map to templates
// ICP: Fractional execs (COO/CMO), boutique strategy firms, ops advisors
export type EngagementType =
  | "strategy"
  | "fractional"
  | "fractional_coo"
  | "fractional_cmo"
  | "ops_transformation"
  | "org_design"
  | "strategic_advisory"
  | "implementation"
  | "advisory"
  | "due_diligence"
  | "custom";

// Billing models for engagement tracking
export type BillingModel = "project" | "retainer" | "hourly" | "value_based";

// Render view for analytics
export type RenderView = {
  id: string;
  renderId: string;
  viewerType: "owner" | "client" | "external" | "anonymous";
  viewerId?: string;
  viewedAt: string;
};

// ============================================================================
// Event Types for Render Layer
// ============================================================================

export type RenderEventType =
  | "block_featured"
  | "block_unfeatured"
  | "render_created"
  | "render_updated"
  | "render_shared"
  | "render_viewed"
  | "template_forked"
  | "mask_annotation_added"
  | "mask_annotation_removed";

export type BlockFeaturedPayload = {
  type: "block_featured";
  blockId: string;
  roomId: string;
  previousFeaturedBlockId?: string;
};

export type BlockUnfeaturedPayload = {
  type: "block_unfeatured";
  blockId: string;
  roomId: string;
};

export type RenderCreatedPayload = {
  type: "render_created";
  renderId: string;
  name: string;
  intent: RenderIntent;
};

export type RenderSharedPayload = {
  type: "render_shared";
  renderId: string;
  shareToken: string;
  audienceType: "client" | "external";
};

export type RenderViewedPayload = {
  type: "render_viewed";
  renderId: string;
  viewerType: "owner" | "client" | "external" | "anonymous";
};

export type TemplateForkPayload = {
  type: "template_forked";
  templateId: string;
  newTemplateId: string;
  templateName: string;
};

export type MaskAnnotationPayload = {
  type: "mask_annotation_added" | "mask_annotation_removed";
  blockId: string;
  annotation: MaskAnnotation;
};

export type RenderEventPayload =
  | BlockFeaturedPayload
  | BlockUnfeaturedPayload
  | RenderCreatedPayload
  | RenderSharedPayload
  | RenderViewedPayload
  | TemplateForkPayload
  | MaskAnnotationPayload;

// ============================================================================
// Computed Render Output
// ============================================================================

// What the render layer produces for display
export type ComputedRender = {
  render: EngagementRender;
  rooms: ComputedRenderRoom[];
  metadata: {
    totalBlocks: number;
    featuredBlocks: number;
    maskedFields: number;
  };
};

export type ComputedRenderRoom = {
  roomId: string;
  roomKey: string;
  label: string;
  blocks: ComputedRenderBlock[];
  template?: string;
};

export type ComputedRenderBlock = {
  id: string;
  blockType: string;
  content: string; // With masks applied
  rawContent?: string; // Original (owner only)
  caption?: string;
  metadata?: Record<string, unknown>;
  featured: boolean;
  masksApplied: string[]; // Which masks were applied
};

// ============================================================================
// Intent Defaults Configuration
// ============================================================================

export const RENDER_INTENT_DEFAULTS: Record<RenderIntent, IntentDefaults> = {
  client_portal: {
    name: "Client Portal",
    description: "Live dashboard for client stakeholders",
    rooms: ["scope", "deliverables", "meetings", "outcomes"],
    showFeaturedOnly: false,
  },
  pitch_deck: {
    name: "Pitch Deck",
    description: "Highlights for prospective clients",
    rooms: ["scope", "outcomes"],
    showFeaturedOnly: true,
  },
  board_summary: {
    name: "Board Summary",
    description: "Executive-level progress view",
    rooms: ["scope", "outcomes", "meetings"],
    showFeaturedOnly: true,
  },
  handover_doc: {
    name: "Handover Document",
    description: "Complete engagement record for successors",
    rooms: ["scope", "research", "deliverables", "meetings", "outcomes"],
    showFeaturedOnly: false,
  },
  demo_render: {
    name: "Demo Render",
    description: "Anonymized version for sales demos",
    rooms: ["scope", "deliverables", "outcomes"],
    showFeaturedOnly: true,
    defaultMasks: {
      clientName: "[Client Name]",
      participantNames: ["[Stakeholder]"],
      figures: "pattern",
      applyManualMasks: true,
    },
  },
  weekly_update: {
    name: "Weekly Update",
    description: "Recent activity summary",
    rooms: ["activities", "decisions", "metrics"],
    showFeaturedOnly: true,
  },
  quarterly_review: {
    name: "Quarterly Review",
    description: "Quarter-over-quarter progress",
    rooms: ["objectives", "metrics", "decisions"],
    showFeaturedOnly: true,
  },
  session_recap: {
    name: "Session Recap",
    description: "Summary of recent advisory session",
    rooms: ["sessions", "recommendations"],
    showFeaturedOnly: true,
  },
  final_report: {
    name: "Final Report",
    description: "Complete engagement deliverable",
    rooms: ["scope", "findings", "risks", "report"],
    showFeaturedOnly: true,
  },
  project_close: {
    name: "Project Close",
    description: "Implementation completion summary",
    rooms: ["scope", "milestones", "handover"],
    showFeaturedOnly: true,
  },
  // Fractional exec focused intents
  monthly_report: {
    name: "Monthly Report",
    description: "Comprehensive monthly progress for retainer clients",
    rooms: ["objectives", "initiatives", "metrics"],
    showFeaturedOnly: false,
  },
  board_prep: {
    name: "Board Prep",
    description: "Condensed view for board deck preparation",
    rooms: ["objectives", "metrics"],
    showFeaturedOnly: true,
  },
  steering_update: {
    name: "Steering Committee Update",
    description: "Executive progress report for steering meetings",
    rooms: ["scope", "roadmap", "metrics"],
    showFeaturedOnly: true,
  },
  relationship_summary: {
    name: "Relationship Summary",
    description: "Quarterly advisory relationship review",
    rooms: ["context", "topics", "recommendations"],
    showFeaturedOnly: true,
  },
  exec_presentation: {
    name: "Executive Presentation",
    description: "High-level view for executive/board audiences",
    rooms: ["context", "recommended", "transition"],
    showFeaturedOnly: true,
  },
  implementation_guide: {
    name: "Implementation Guide",
    description: "Detailed implementation documentation",
    rooms: ["recommended", "transition", "comms"],
    showFeaturedOnly: false,
  },
  custom: {
    name: "Custom Render",
    description: "Custom configuration",
    rooms: [],
    showFeaturedOnly: false,
  },
};
