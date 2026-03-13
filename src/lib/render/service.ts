// ============================================================================
// Render Service
// Computes rendered output with masks, featured blocks, and intent-based filtering
// ============================================================================

import type {
  RenderConfig,
  ComputedRender,
  ComputedRenderRoom,
  ComputedRenderBlock,
  MaskAnnotation,
  EngagementRender,
} from "@/types/render";

// Pattern matchers for automatic masking
const CURRENCY_PATTERN = /\$[\d,]+(?:\.\d{2})?|\d+(?:,\d{3})+(?:\.\d{2})?\s*(?:USD|EUR|GBP|dollars?)/gi;
const PERCENTAGE_PATTERN = /\d+(?:\.\d+)?%/g;
const LARGE_NUMBER_PATTERN = /\b\d{1,3}(?:,\d{3})+\b/g;

type BlockData = {
  id: string;
  block_type: string;
  content?: string;
  caption?: string;
  metadata?: Record<string, unknown>;
  featured?: boolean;
  mask_annotations?: MaskAnnotation[];
};

type RoomData = {
  id: string;
  key: string;
  label: string;
  blocks: BlockData[];
};

// Apply a single mask annotation to text
function applyMaskAnnotation(
  text: string,
  annotation: MaskAnnotation
): string {
  if (annotation.start < 0 || annotation.end > text.length) {
    return text;
  }
  return (
    text.slice(0, annotation.start) +
    annotation.placeholder +
    text.slice(annotation.end)
  );
}

// Apply all mask annotations to text (in reverse order to preserve positions)
function applyMaskAnnotations(
  text: string,
  annotations: MaskAnnotation[]
): { text: string; applied: string[] } {
  const sorted = [...annotations].sort((a, b) => b.start - a.start);
  let result = text;
  const applied: string[] = [];

  for (const annotation of sorted) {
    result = applyMaskAnnotation(result, annotation);
    applied.push(annotation.placeholder);
  }

  return { text: result, applied };
}

// Apply pattern-based masking
function applyPatternMasks(
  text: string,
  figureMode: "pattern" | "redact" | "none"
): { text: string; applied: string[] } {
  if (figureMode === "none") {
    return { text, applied: [] };
  }

  const applied: string[] = [];
  let result = text;

  if (figureMode === "pattern") {
    // Replace with pattern placeholders
    result = result.replace(CURRENCY_PATTERN, (match) => {
      applied.push("currency");
      return "$XX,XXX";
    });
    result = result.replace(PERCENTAGE_PATTERN, (match) => {
      applied.push("percentage");
      return "XX%";
    });
  } else if (figureMode === "redact") {
    // Replace with [REDACTED]
    result = result.replace(CURRENCY_PATTERN, () => {
      applied.push("currency");
      return "[REDACTED]";
    });
    result = result.replace(PERCENTAGE_PATTERN, () => {
      applied.push("percentage");
      return "[REDACTED]";
    });
    result = result.replace(LARGE_NUMBER_PATTERN, () => {
      applied.push("number");
      return "[REDACTED]";
    });
  }

  return { text: result, applied };
}

// Apply global text replacements (client name, participant names)
function applyGlobalMasks(
  text: string,
  masks: RenderConfig["masks"],
  engagementData?: { clientName?: string; participantNames?: string[] }
): { text: string; applied: string[] } {
  const applied: string[] = [];
  let result = text;

  // Replace client name
  if (masks?.clientName && engagementData?.clientName) {
    const regex = new RegExp(escapeRegex(engagementData.clientName), "gi");
    if (regex.test(result)) {
      result = result.replace(regex, masks.clientName);
      applied.push("clientName");
    }
  }

  // Replace participant names
  if (masks?.participantNames && engagementData?.participantNames) {
    engagementData.participantNames.forEach((name, index) => {
      const placeholder = masks.participantNames?.[index] ||
        masks.participantNames?.[0] ||
        "[Participant]";
      const regex = new RegExp(escapeRegex(name), "gi");
      if (regex.test(result)) {
        result = result.replace(regex, placeholder);
        applied.push("participantName");
      }
    });
  }

  return { text: result, applied };
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Compute a single block with masks applied
function computeBlock(
  block: BlockData,
  config: RenderConfig,
  engagementData?: { clientName?: string; participantNames?: string[] },
  isOwner: boolean = false
): ComputedRenderBlock {
  let content = block.content || "";
  const allApplied: string[] = [];

  // Apply manual mask annotations first (if enabled)
  if (config.masks?.applyManualMasks && block.mask_annotations?.length) {
    const result = applyMaskAnnotations(content, block.mask_annotations);
    content = result.text;
    allApplied.push(...result.applied);
  }

  // Apply global masks (client name, participants)
  if (config.masks) {
    const result = applyGlobalMasks(content, config.masks, engagementData);
    content = result.text;
    allApplied.push(...result.applied);
  }

  // Apply pattern masks (currencies, percentages)
  if (config.masks?.figures && config.masks.figures !== "none") {
    const result = applyPatternMasks(content, config.masks.figures);
    content = result.text;
    allApplied.push(...result.applied);
  }

  return {
    id: block.id,
    blockType: block.block_type,
    content,
    rawContent: isOwner ? block.content : undefined,
    caption: block.caption,
    metadata: block.metadata,
    featured: block.featured || false,
    masksApplied: [...new Set(allApplied)],
  };
}

// Compute a full render
export function computeRender(
  render: EngagementRender,
  rooms: RoomData[],
  engagementData?: { clientName?: string; participantNames?: string[] },
  isOwner: boolean = false
): ComputedRender {
  const config = render.renderConfig;
  const includedRoomKeys = new Set(
    render.roomSelections
      .filter((s) => s.included)
      .map((s) => s.roomKey)
  );

  // Filter and order rooms based on sequence
  let filteredRooms = rooms.filter((r) => includedRoomKeys.has(r.key));
  if (config.sequence?.length) {
    const keyOrder = new Map(config.sequence.map((k, i) => [k, i]));
    filteredRooms.sort((a, b) => {
      const aOrder = keyOrder.get(a.key) ?? 999;
      const bOrder = keyOrder.get(b.key) ?? 999;
      return aOrder - bOrder;
    });
  }

  let totalBlocks = 0;
  let featuredBlocks = 0;
  let maskedFields = 0;

  const computedRooms: ComputedRenderRoom[] = filteredRooms.map((room) => {
    // Filter blocks based on showFeaturedOnly
    let blocks = room.blocks;
    if (config.showFeaturedOnly) {
      blocks = blocks.filter((b) => b.featured);
    }

    const computedBlocks = blocks.map((block) => {
      const computed = computeBlock(block, config, engagementData, isOwner);
      totalBlocks++;
      if (computed.featured) featuredBlocks++;
      maskedFields += computed.masksApplied.length;
      return computed;
    });

    const roomSelection = render.roomSelections.find((s) => s.roomKey === room.key);

    return {
      roomId: room.id,
      roomKey: room.key,
      label: room.label,
      blocks: computedBlocks,
      template: roomSelection?.template,
    };
  });

  return {
    render,
    rooms: computedRooms,
    metadata: {
      totalBlocks,
      featuredBlocks,
      maskedFields,
    },
  };
}

// Generate a share token
export function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Get featured block for a room (null if none)
export function getFeaturedBlock(blocks: BlockData[]): BlockData | null {
  return blocks.find((b) => b.featured) || null;
}

// Validate only one featured block per room
export function validateFeaturedConstraint(
  roomBlocks: BlockData[],
  newFeaturedId: string
): { valid: boolean; previousFeaturedId?: string } {
  const currentFeatured = roomBlocks.find((b) => b.featured && b.id !== newFeaturedId);
  return {
    valid: true,
    previousFeaturedId: currentFeatured?.id,
  };
}
