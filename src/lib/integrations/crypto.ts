// ════════════════════════════════════════════════════════════════════════════
// Integration Token Encryption
// AES-256-GCM encryption for OAuth tokens and HMAC-SHA256 for state signing
// ════════════════════════════════════════════════════════════════════════════

import crypto from "crypto";

// ── Types ────────────────────────────────────────────────────────────────────

export type OAuthCredentials = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp in seconds
  scopes: string[];
  tokenType?: string;
  userInfo?: {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
};

export type OAuthStatePayload = {
  provider: string;
  engagementId: string;
  integrationId?: string;
  returnUrl: string;
  nonce: string;
  exp: number; // Expiration timestamp
};

// ── Encryption Key ───────────────────────────────────────────────────────────

function getEncryptionKey(): Buffer {
  const keyHex = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY environment variable is not set");
  }

  // Key should be 32 bytes (64 hex chars) for AES-256
  if (keyHex.length !== 64) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }

  return Buffer.from(keyHex, "hex");
}

// ── Credential Encryption ────────────────────────────────────────────────────

/**
 * Encrypt OAuth credentials for storage in database
 * Uses AES-256-GCM for authenticated encryption
 */
export function encryptCredentials(credentials: OAuthCredentials): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const plaintext = JSON.stringify(credentials);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext (all base64)
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/**
 * Decrypt OAuth credentials from database
 */
export function decryptCredentials(encryptedData: string): OAuthCredentials {
  const key = getEncryptionKey();
  const parts = encryptedData.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted credentials format");
  }

  const [ivB64, authTagB64, ciphertextB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

// ── OAuth State Signing ──────────────────────────────────────────────────────

/**
 * Sign OAuth state payload for CSRF protection
 * Returns a URL-safe base64 string
 */
export function signOAuthState(payload: OAuthStatePayload): string {
  const key = getEncryptionKey();
  const data = JSON.stringify(payload);
  const dataB64 = Buffer.from(data).toString("base64url");

  const hmac = crypto.createHmac("sha256", key);
  hmac.update(dataB64);
  const signature = hmac.digest("base64url");

  // Format: data.signature (both base64url)
  return `${dataB64}.${signature}`;
}

/**
 * Verify and decode OAuth state
 * Returns null if invalid or expired
 */
export function verifyOAuthState(signedState: string): OAuthStatePayload | null {
  try {
    const key = getEncryptionKey();
    const parts = signedState.split(".");

    if (parts.length !== 2) {
      return null;
    }

    const [dataB64, signature] = parts;

    // Verify signature
    const hmac = crypto.createHmac("sha256", key);
    hmac.update(dataB64);
    const expectedSignature = hmac.digest("base64url");

    if (!crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )) {
      return null;
    }

    // Decode payload
    const data = Buffer.from(dataB64, "base64url").toString("utf8");
    const payload = JSON.parse(data) as OAuthStatePayload;

    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString("base64url");
}

/**
 * Create a signed OAuth state for initiating OAuth flow
 */
export function createOAuthState(
  provider: string,
  engagementId: string,
  returnUrl: string,
  integrationId?: string
): string {
  const payload: OAuthStatePayload = {
    provider,
    engagementId,
    integrationId,
    returnUrl,
    nonce: generateNonce(),
    exp: Math.floor(Date.now() / 1000) + 600, // 10 minute expiration
  };

  return signOAuthState(payload);
}
