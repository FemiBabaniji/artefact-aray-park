// ════════════════════════════════════════════════════════════════════════════
// Gmail Sync Client
// Fetches emails from Gmail API matching client domains
// ════════════════════════════════════════════════════════════════════════════

import type { EmailMessage, EmailAddress } from "@/types/integration";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

type GmailMessageListResponse = {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

type GmailMessage = {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: { name: string; value: string }[];
    parts?: GmailPart[];
    body?: { data?: string; size: number };
    mimeType: string;
  };
  internalDate: string;
};

type GmailPart = {
  mimeType: string;
  body: { data?: string; size: number };
  parts?: GmailPart[];
};

export type GmailSyncOptions = {
  accessToken: string;
  clientDomains: string[];
  lastSyncAt?: string | null;
  maxResults?: number;
};

export type GmailSyncResult = {
  success: boolean;
  emails: EmailMessage[];
  errors: string[];
  nextSyncCursor?: string;
};

/**
 * Fetch emails from Gmail matching client domains
 */
export async function fetchGmailEmails(
  options: GmailSyncOptions
): Promise<GmailSyncResult> {
  const {
    accessToken,
    clientDomains,
    lastSyncAt,
    maxResults = 50,
  } = options;

  const errors: string[] = [];
  const emails: EmailMessage[] = [];

  try {
    // Build search query for emails from/to client domains
    const domainQueries = clientDomains.map(
      (domain) => `(from:${domain} OR to:${domain})`
    );
    let query = domainQueries.join(" OR ");

    // Add date filter if lastSyncAt provided
    if (lastSyncAt) {
      const afterDate = new Date(lastSyncAt);
      // Gmail uses epoch seconds for after: query
      const afterEpoch = Math.floor(afterDate.getTime() / 1000);
      query = `(${query}) after:${afterEpoch}`;
    }

    // List messages matching query
    const listUrl = new URL(`${GMAIL_API_BASE}/messages`);
    listUrl.searchParams.set("q", query);
    listUrl.searchParams.set("maxResults", String(maxResults));

    const listResponse = await fetch(listUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      return {
        success: false,
        emails: [],
        errors: [`Failed to list messages: ${listResponse.status} - ${errorText}`],
      };
    }

    const listData: GmailMessageListResponse = await listResponse.json();

    if (!listData.messages || listData.messages.length === 0) {
      return { success: true, emails: [], errors: [] };
    }

    // Fetch each message
    for (const msg of listData.messages) {
      try {
        const email = await fetchGmailMessage(accessToken, msg.id);
        if (email) {
          emails.push(email);
        }
      } catch (error) {
        errors.push(`Failed to fetch message ${msg.id}: ${error}`);
      }
    }

    return {
      success: true,
      emails,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      emails: [],
      errors: [`Gmail sync failed: ${error}`],
    };
  }
}

/**
 * Fetch a single Gmail message with full content
 */
async function fetchGmailMessage(
  accessToken: string,
  messageId: string
): Promise<EmailMessage | null> {
  const url = `${GMAIL_API_BASE}/messages/${messageId}?format=full`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    console.error(`Failed to fetch message ${messageId}:`, response.status);
    return null;
  }

  const message: GmailMessage = await response.json();

  // Extract headers
  const headers = message.payload.headers;
  const getHeader = (name: string): string =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  // Parse from address
  const fromHeader = getHeader("From");
  const from = parseEmailAddress(fromHeader);

  // Parse to addresses
  const toHeader = getHeader("To");
  const to = parseEmailAddresses(toHeader);

  // Parse cc addresses
  const ccHeader = getHeader("Cc");
  const cc = ccHeader ? parseEmailAddresses(ccHeader) : undefined;

  // Extract body
  const body = extractBody(message.payload);

  return {
    id: message.id,
    threadId: message.threadId,
    subject: getHeader("Subject"),
    from,
    to,
    cc,
    date: new Date(parseInt(message.internalDate)).toISOString(),
    snippet: message.snippet,
    body: body.plain || body.html || message.snippet,
    bodyHtml: body.html,
  };
}

/**
 * Extract plain text and HTML body from message payload
 */
function extractBody(payload: GmailMessage["payload"]): { plain?: string; html?: string } {
  const result: { plain?: string; html?: string } = {};

  // Direct body (simple messages)
  if (payload.body?.data) {
    const content = decodeBase64Url(payload.body.data);
    if (payload.mimeType === "text/plain") {
      result.plain = content;
    } else if (payload.mimeType === "text/html") {
      result.html = content;
    }
  }

  // Multipart messages
  if (payload.parts) {
    extractBodyFromParts(payload.parts, result);
  }

  return result;
}

/**
 * Recursively extract body from message parts
 */
function extractBodyFromParts(
  parts: GmailPart[],
  result: { plain?: string; html?: string }
): void {
  for (const part of parts) {
    if (part.mimeType === "text/plain" && part.body?.data) {
      result.plain = decodeBase64Url(part.body.data);
    } else if (part.mimeType === "text/html" && part.body?.data) {
      result.html = decodeBase64Url(part.body.data);
    } else if (part.parts) {
      extractBodyFromParts(part.parts, result);
    }
  }
}

/**
 * Decode base64url encoded string
 */
function decodeBase64Url(data: string): string {
  // Replace base64url chars with base64 chars
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Parse email address from "Name <email@example.com>" format
 */
function parseEmailAddress(header: string): EmailAddress {
  const match = header.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
  if (match) {
    return {
      email: match[2].trim(),
      name: match[1]?.trim() || undefined,
    };
  }
  return { email: header.trim() };
}

/**
 * Parse multiple email addresses from comma-separated header
 */
function parseEmailAddresses(header: string): EmailAddress[] {
  // Split by comma but not inside quotes
  const addresses: EmailAddress[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of header) {
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === "," && !inQuotes) {
      if (current.trim()) {
        addresses.push(parseEmailAddress(current.trim()));
      }
      current = "";
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    addresses.push(parseEmailAddress(current.trim()));
  }

  return addresses;
}

/**
 * Check if email is from/to a client domain
 */
export function matchesClientDomain(
  email: EmailMessage,
  clientDomains: string[]
): boolean {
  const domains = clientDomains.map((d) => d.toLowerCase());

  const fromDomain = email.from.email.split("@")[1]?.toLowerCase();
  if (fromDomain && domains.includes(fromDomain)) {
    return true;
  }

  for (const to of email.to) {
    const toDomain = to.email.split("@")[1]?.toLowerCase();
    if (toDomain && domains.includes(toDomain)) {
      return true;
    }
  }

  return false;
}
