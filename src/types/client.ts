// ════════════════════════════════════════════════════════════════════════════
// Client Types - Organization/Contact Management
// Consulting OS: First-class client entity for engagement tracking
// ════════════════════════════════════════════════════════════════════════════

// ── Client Entity ─────────────────────────────────────────────────────────────

export type ClientType = "organization" | "individual";

export type Client = {
  id: string;
  type: ClientType;
  name: string;                    // "Acme Corp" or "Jane Doe"
  slug: string;                    // URL-safe identifier
  industry?: string;
  website?: string;
  logoUrl?: string;
  notes?: string;
  tags: string[];
  ownerId: string;                 // Practice owner who created
  createdAt: string;
  updatedAt: string;
};

// ── Client Contacts ───────────────────────────────────────────────────────────

export type ClientContact = {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
};

// ── Client with Engagement History ────────────────────────────────────────────

export type ClientWithEngagements = Client & {
  contacts: ClientContact[];
  engagementCount: number;
  totalValue: number;
  lastEngagementDate?: string;
  activeEngagements: number;
};

// ── Client Summary (for lists) ────────────────────────────────────────────────

export type ClientSummary = {
  id: string;
  name: string;
  slug: string;
  type: ClientType;
  industry?: string;
  logoUrl?: string;
  engagementCount: number;
  activeEngagements: number;
  lastEngagementDate?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function createClientId(): string {
  return crypto.randomUUID();
}

export function createContactId(): string {
  return crypto.randomUUID();
}

export function slugifyClientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export function getClientInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
