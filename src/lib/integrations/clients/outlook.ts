// ════════════════════════════════════════════════════════════════════════════
// Outlook Sync Client
// Fetches emails from Microsoft Graph API matching client domains
// ════════════════════════════════════════════════════════════════════════════

import type { EmailMessage, EmailAddress } from "@/types/integration";

const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";

type GraphMessageListResponse = {
  value: GraphMessage[];
  "@odata.nextLink"?: string;
};

type GraphMessage = {
  id: string;
  conversationId: string;
  subject: string;
  bodyPreview: string;
  body: {
    contentType: "text" | "html";
    content: string;
  };
  from: {
    emailAddress: { name?: string; address: string };
  };
  toRecipients: {
    emailAddress: { name?: string; address: string };
  }[];
  ccRecipients?: {
    emailAddress: { name?: string; address: string };
  }[];
  receivedDateTime: string;
  isRead: boolean;
};

export type OutlookSyncOptions = {
  accessToken: string;
  clientDomains: string[];
  lastSyncAt?: string | null;
  maxResults?: number;
};

export type OutlookSyncResult = {
  success: boolean;
  emails: EmailMessage[];
  errors: string[];
  nextSyncCursor?: string;
};

/**
 * Fetch emails from Outlook matching client domains
 */
export async function fetchOutlookEmails(
  options: OutlookSyncOptions
): Promise<OutlookSyncResult> {
  const {
    accessToken,
    clientDomains,
    lastSyncAt,
    maxResults = 50,
  } = options;

  const errors: string[] = [];
  const emails: EmailMessage[] = [];

  try {
    // Build OData filter for emails from/to client domains
    const domainFilters = clientDomains.flatMap((domain) => [
      `contains(from/emailAddress/address, '${domain}')`,
      `toRecipients/any(r: contains(r/emailAddress/address, '${domain}'))`,
    ]);

    let filter = `(${domainFilters.join(" or ")})`;

    // Add date filter if lastSyncAt provided
    if (lastSyncAt) {
      const afterDate = new Date(lastSyncAt).toISOString();
      filter = `${filter} and receivedDateTime ge ${afterDate}`;
    }

    // Build request URL
    const url = new URL(`${GRAPH_API_BASE}/me/messages`);
    url.searchParams.set("$filter", filter);
    url.searchParams.set("$top", String(maxResults));
    url.searchParams.set("$orderby", "receivedDateTime desc");
    url.searchParams.set(
      "$select",
      "id,conversationId,subject,bodyPreview,body,from,toRecipients,ccRecipients,receivedDateTime"
    );

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        emails: [],
        errors: [`Failed to fetch messages: ${response.status} - ${errorText}`],
      };
    }

    const data: GraphMessageListResponse = await response.json();

    // Convert to EmailMessage format
    for (const msg of data.value) {
      try {
        const email = convertGraphMessage(msg);
        // Double-check domain filter (Graph API contains() is case-insensitive but broad)
        if (matchesClientDomain(email, clientDomains)) {
          emails.push(email);
        }
      } catch (error) {
        errors.push(`Failed to process message ${msg.id}: ${error}`);
      }
    }

    return {
      success: true,
      emails,
      errors,
      nextSyncCursor: data["@odata.nextLink"],
    };
  } catch (error) {
    return {
      success: false,
      emails: [],
      errors: [`Outlook sync failed: ${error}`],
    };
  }
}

/**
 * Convert Microsoft Graph message to EmailMessage
 */
function convertGraphMessage(msg: GraphMessage): EmailMessage {
  return {
    id: msg.id,
    threadId: msg.conversationId,
    subject: msg.subject,
    from: {
      email: msg.from.emailAddress.address,
      name: msg.from.emailAddress.name,
    },
    to: msg.toRecipients.map((r) => ({
      email: r.emailAddress.address,
      name: r.emailAddress.name,
    })),
    cc: msg.ccRecipients?.map((r) => ({
      email: r.emailAddress.address,
      name: r.emailAddress.name,
    })),
    date: msg.receivedDateTime,
    snippet: msg.bodyPreview,
    body: msg.body.contentType === "text" ? msg.body.content : stripHtml(msg.body.content),
    bodyHtml: msg.body.contentType === "html" ? msg.body.content : undefined,
  };
}

/**
 * Simple HTML tag stripper for text extraction
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

/**
 * Fetch a single Outlook message by ID
 */
export async function fetchOutlookMessage(
  accessToken: string,
  messageId: string
): Promise<EmailMessage | null> {
  try {
    const url = new URL(`${GRAPH_API_BASE}/me/messages/${messageId}`);
    url.searchParams.set(
      "$select",
      "id,conversationId,subject,bodyPreview,body,from,toRecipients,ccRecipients,receivedDateTime"
    );

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch message ${messageId}:`, response.status);
      return null;
    }

    const msg: GraphMessage = await response.json();
    return convertGraphMessage(msg);
  } catch (error) {
    console.error(`Error fetching message ${messageId}:`, error);
    return null;
  }
}
