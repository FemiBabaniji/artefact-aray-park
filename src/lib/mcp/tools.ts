// ════════════════════════════════════════════════════════════════════════════
// MCP Tool Definitions
// Defines tools that AI agents can use to write to engagements
// ════════════════════════════════════════════════════════════════════════════

// ── Tool Schema Types ────────────────────────────────────────────────────────

export type MCPToolSchema = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      items?: { type: string };
    }>;
    required: string[];
  };
};

export type MCPToolDefinition = MCPToolSchema & {
  handler: string; // Handler function name for routing
};

// ── Room Keys ────────────────────────────────────────────────────────────────

export const ENGAGEMENT_ROOM_KEYS = [
  "scope",
  "research",
  "deliverables",
  "meetings",
  "outcomes",
  "documents",
] as const;

export type EngagementRoomKey = typeof ENGAGEMENT_ROOM_KEYS[number];

// ── Block Types ──────────────────────────────────────────────────────────────

export const ENGAGEMENT_BLOCK_TYPES = [
  "text",
  "decision",
  "file",
  "outcome",
] as const;

export type EngagementBlockType = typeof ENGAGEMENT_BLOCK_TYPES[number];

// ── Tool Definitions ─────────────────────────────────────────────────────────

export const MCP_TOOLS: MCPToolDefinition[] = [
  {
    name: "engagement.addBlock",
    description: "Add a block to an engagement room. Use this for general content like notes, text, or outcomes.",
    handler: "handleAddBlock",
    inputSchema: {
      type: "object",
      properties: {
        engagementSlug: {
          type: "string",
          description: "The engagement slug (URL-safe identifier)",
        },
        roomKey: {
          type: "string",
          description: "The room to add the block to",
          enum: [...ENGAGEMENT_ROOM_KEYS],
        },
        blockType: {
          type: "string",
          description: "The type of block",
          enum: [...ENGAGEMENT_BLOCK_TYPES],
        },
        content: {
          type: "string",
          description: "The content of the block",
        },
        caption: {
          type: "string",
          description: "Optional caption for file blocks",
        },
        metadata: {
          type: "object",
          description: "Optional metadata (e.g., for decision blocks: title, rationale, attendees)",
        },
      },
      required: ["engagementSlug", "roomKey", "blockType", "content"],
    },
  },
  {
    name: "engagement.logDecision",
    description: "Log a decision to the Meetings & Decisions room. Use this after client calls or workshops to record what was agreed.",
    handler: "handleLogDecision",
    inputSchema: {
      type: "object",
      properties: {
        engagementSlug: {
          type: "string",
          description: "The engagement slug (URL-safe identifier)",
        },
        title: {
          type: "string",
          description: "Short title for the decision (e.g., 'Positioning direction selected')",
        },
        decision: {
          type: "string",
          description: "The actual decision made (e.g., 'Option B — Clinical efficacy positioning')",
        },
        rationale: {
          type: "string",
          description: "Why this decision was made",
        },
        attendees: {
          type: "array",
          description: "Names of people who were present for this decision",
          items: { type: "string" },
        },
      },
      required: ["engagementSlug", "title", "decision"],
    },
  },
  {
    name: "engagement.addNote",
    description: "Add a note to any engagement room. Use this for meeting notes, observations, or context.",
    handler: "handleAddNote",
    inputSchema: {
      type: "object",
      properties: {
        engagementSlug: {
          type: "string",
          description: "The engagement slug (URL-safe identifier)",
        },
        roomKey: {
          type: "string",
          description: "The room to add the note to",
          enum: [...ENGAGEMENT_ROOM_KEYS],
        },
        content: {
          type: "string",
          description: "The note content",
        },
      },
      required: ["engagementSlug", "roomKey", "content"],
    },
  },
  {
    name: "engagement.updatePhase",
    description: "Change the engagement phase (e.g., from 'delivery' to 'completed'). Use this to track engagement lifecycle.",
    handler: "handleUpdatePhase",
    inputSchema: {
      type: "object",
      properties: {
        engagementSlug: {
          type: "string",
          description: "The engagement slug (URL-safe identifier)",
        },
        phase: {
          type: "string",
          description: "The new phase",
          enum: ["intake", "qualification", "proposal", "negotiation", "signed", "delivery", "completed", "archived"],
        },
        reason: {
          type: "string",
          description: "Optional reason for the phase change",
        },
      },
      required: ["engagementSlug", "phase"],
    },
  },
  // ── Context Ingestion Tools ───────────────────────────────────────────────
  {
    name: "context.summarizeEmail",
    description: "Summarize an email thread and optionally save as a decision or note to an engagement.",
    handler: "handleSummarizeEmail",
    inputSchema: {
      type: "object",
      properties: {
        engagementSlug: {
          type: "string",
          description: "The engagement slug to add context to",
        },
        emailContent: {
          type: "string",
          description: "The full email thread content to summarize",
        },
        roomKey: {
          type: "string",
          description: "The room to save the summary to",
          enum: [...ENGAGEMENT_ROOM_KEYS],
        },
        extractDecisions: {
          type: "boolean",
          description: "Whether to extract and log any decisions mentioned",
        },
      },
      required: ["engagementSlug", "emailContent"],
    },
  },
  {
    name: "context.summarizeMeeting",
    description: "Summarize a meeting transcript and extract key decisions, action items, and notes.",
    handler: "handleSummarizeMeeting",
    inputSchema: {
      type: "object",
      properties: {
        engagementSlug: {
          type: "string",
          description: "The engagement slug to add context to",
        },
        transcript: {
          type: "string",
          description: "The meeting transcript to summarize",
        },
        meetingTitle: {
          type: "string",
          description: "Title of the meeting",
        },
        meetingDate: {
          type: "string",
          description: "Date of the meeting (ISO format)",
        },
        attendees: {
          type: "array",
          description: "Names of meeting attendees",
          items: { type: "string" },
        },
      },
      required: ["engagementSlug", "transcript"],
    },
  },
  {
    name: "context.ingestDocument",
    description: "Ingest and summarize a document, extracting key points and context for the engagement.",
    handler: "handleIngestDocument",
    inputSchema: {
      type: "object",
      properties: {
        engagementSlug: {
          type: "string",
          description: "The engagement slug to add context to",
        },
        documentContent: {
          type: "string",
          description: "The document content to ingest",
        },
        documentTitle: {
          type: "string",
          description: "Title of the document",
        },
        documentType: {
          type: "string",
          description: "Type of document",
          enum: ["brief", "proposal", "contract", "research", "report", "other"],
        },
        roomKey: {
          type: "string",
          description: "The room to save insights to",
          enum: [...ENGAGEMENT_ROOM_KEYS],
        },
      },
      required: ["engagementSlug", "documentContent"],
    },
  },
];

// ── Tool Lookup ──────────────────────────────────────────────────────────────

export function getToolByName(name: string): MCPToolDefinition | undefined {
  return MCP_TOOLS.find((t) => t.name === name);
}

export function getToolSchemas(): MCPToolSchema[] {
  return MCP_TOOLS.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  }));
}

// ── Input Validation ─────────────────────────────────────────────────────────

export type ToolValidationResult = {
  valid: boolean;
  errors?: string[];
};

export function validateToolArguments(
  tool: MCPToolDefinition,
  args: Record<string, unknown>
): ToolValidationResult {
  const errors: string[] = [];
  const { properties, required } = tool.inputSchema;

  // Check required fields
  for (const field of required) {
    if (args[field] === undefined || args[field] === null || args[field] === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check field types
  for (const [key, value] of Object.entries(args)) {
    const schema = properties[key];
    if (!schema) continue;

    if (schema.type === "string" && typeof value !== "string") {
      errors.push(`Field '${key}' must be a string`);
    }

    if (schema.type === "array" && !Array.isArray(value)) {
      errors.push(`Field '${key}' must be an array`);
    }

    if (schema.enum && !schema.enum.includes(value as string)) {
      errors.push(`Field '${key}' must be one of: ${schema.enum.join(", ")}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
