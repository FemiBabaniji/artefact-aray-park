// Document ingestion types
// Supports: text, PDF, slides (presentations), URL (web pages)

export type DocumentType = "text" | "pdf" | "slides" | "url";

export type DocumentStatus =
  | "uploading"
  | "extracting"
  | "processing"
  | "ready"
  | "error";

// Raw document metadata (stored in object storage)
export type Document = {
  id: string;
  type: DocumentType;
  filename: string;
  url?: string;              // Object storage URL
  storagePath?: string;      // Path in storage bucket
  size: number;              // bytes
  mimeType: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
};

// Extracted content from document
export type ExtractedContent = {
  documentId: string;
  rawText: string;           // Full extracted text
  pageCount?: number;        // For PDFs/slides
  pages?: PageContent[];     // Per-page content
  metadata?: DocumentMetadata;
  // URL extraction specific
  summary?: string;          // AI-generated summary
  blocks?: Array<{           // Structured blocks from agentic extraction
    type: string;
    content: string;
    metadata?: Record<string, unknown>;
  }>;
};

export type PageContent = {
  pageNumber: number;
  text: string;
  images?: string[];         // Image URLs if extracted
};

export type DocumentMetadata = {
  title?: string;
  author?: string;
  createdAt?: string;
  modifiedAt?: string;
  keywords?: string[];
  [key: string]: unknown;
};

// Parsed/structured content (from LLM or parser)
export type ParsedContent = {
  documentId: string;
  documentType: DocumentType;
  summary: string;
  entities: ParsedEntity[];
  metrics?: ParsedMetric[];
  sections?: ParsedSection[];
};

export type ParsedEntity = {
  type: "person" | "company" | "project" | "skill" | "location" | "date" | "other";
  value: string;
  confidence?: number;
};

export type ParsedMetric = {
  name: string;
  value: number | string;
  unit?: string;
  context?: string;
};

export type ParsedSection = {
  heading?: string;
  content: string;
  type?: "intro" | "experience" | "skills" | "education" | "projects" | "other";
};

// Document block for ingestion workspace
export type DocumentBlock = {
  id: string;
  type: "text" | "document";
  // For text blocks
  content?: string;
  // For document blocks
  document?: Document;
  extractedContent?: ExtractedContent;
  parsedContent?: ParsedContent;
  // Common
  orderIndex: number;
  createdAt: string;
};

// Workspace state for ingestion
export type IngestWorkspaceState = {
  blocks: DocumentBlock[];
  activeBlockId: string | null;
  isProcessing: boolean;
};

// Pull target - where to send extracted content
export type PullTarget = {
  type: "room" | "identity";
  roomId?: string;
  field?: string;
};

// Helpers
export function getDocumentTypeIcon(type: DocumentType): string {
  switch (type) {
    case "pdf":    return "\u2B1A"; // PDF icon
    case "slides": return "\u229E"; // Grid icon
    case "text":   return "T";
    case "url":    return "\u21D7"; // Link icon
    default:       return "\u25A1";
  }
}

export function getDocumentTypeLabel(type: DocumentType): string {
  switch (type) {
    case "pdf":    return "PDF";
    case "slides": return "Slides";
    case "text":   return "Text";
    case "url":    return "URL";
    default:       return type;
  }
}

export function getMimeTypeForDocument(type: DocumentType): string[] {
  switch (type) {
    case "pdf":
      return ["application/pdf"];
    case "slides":
      return [
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.google-apps.presentation",
      ];
    case "text":
      return ["text/plain", "text/markdown", "text/html"];
    default:
      return [];
  }
}

export function detectDocumentType(mimeType: string): DocumentType {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "slides";
  return "text";
}
