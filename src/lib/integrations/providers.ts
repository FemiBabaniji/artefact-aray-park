// ════════════════════════════════════════════════════════════════════════════
// OAuth Provider Configuration
// Configuration for all supported OAuth providers
// ════════════════════════════════════════════════════════════════════════════

import type { OAuthProviderConfig, IntegrationProvider } from "@/types/integration";

// ── Provider Configurations ──────────────────────────────────────────────────

export const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  gmail: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    revokeUrl: "https://oauth2.googleapis.com/revoke",
    userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
  },

  outlook: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scopes: [
      "https://graph.microsoft.com/Mail.Read",
      "https://graph.microsoft.com/User.Read",
      "offline_access",
    ],
    clientIdEnv: "MICROSOFT_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_CLIENT_SECRET",
    userInfoUrl: "https://graph.microsoft.com/v1.0/me",
  },

  slack: {
    authUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: [
      "channels:history",
      "channels:read",
      "groups:history",
      "groups:read",
      "users:read",
      "team:read",
    ],
    clientIdEnv: "SLACK_CLIENT_ID",
    clientSecretEnv: "SLACK_CLIENT_SECRET",
    userInfoUrl: "https://slack.com/api/auth.test",
  },

  discord: {
    authUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    scopes: [
      "identify",
      "guilds",
      "guilds.members.read",
    ],
    clientIdEnv: "DISCORD_CLIENT_ID",
    clientSecretEnv: "DISCORD_CLIENT_SECRET",
    revokeUrl: "https://discord.com/api/oauth2/token/revoke",
    userInfoUrl: "https://discord.com/api/users/@me",
  },

  zoom: {
    authUrl: "https://zoom.us/oauth/authorize",
    tokenUrl: "https://zoom.us/oauth/token",
    scopes: [
      "recording:read",
      "user:read",
    ],
    clientIdEnv: "ZOOM_CLIENT_ID",
    clientSecretEnv: "ZOOM_CLIENT_SECRET",
    revokeUrl: "https://zoom.us/oauth/revoke",
    userInfoUrl: "https://api.zoom.us/v2/users/me",
  },
};

// Map database integration_type to OAuth provider
export const INTEGRATION_TO_PROVIDER: Record<IntegrationProvider, string | null> = {
  gmail: "gmail",
  outlook: "outlook",
  slack: "slack",
  discord: "discord",
  zoom: "zoom",
  meeting: "zoom", // Default meeting provider is Zoom
};

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Get OAuth provider configuration
 */
export function getProviderConfig(provider: string): OAuthProviderConfig | null {
  return OAUTH_PROVIDERS[provider] ?? null;
}

/**
 * Get OAuth client credentials from environment
 */
export function getClientCredentials(provider: string): {
  clientId: string;
  clientSecret: string;
} | null {
  const config = getProviderConfig(provider);
  if (!config) return null;

  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

/**
 * Check if a provider is configured (has credentials)
 */
export function isProviderConfigured(provider: string): boolean {
  return getClientCredentials(provider) !== null;
}

/**
 * Get the callback URL for OAuth
 */
export function getCallbackUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return `${baseUrl}/api/integrations/oauth/callback`;
}

/**
 * Build the authorization URL for a provider
 */
export function buildAuthUrl(
  provider: string,
  state: string,
  additionalParams?: Record<string, string>
): string | null {
  const config = getProviderConfig(provider);
  const credentials = getClientCredentials(provider);

  if (!config || !credentials) return null;

  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: getCallbackUrl(),
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
    ...additionalParams,
  });

  // Provider-specific params
  if (provider === "gmail") {
    params.set("access_type", "offline");
    params.set("prompt", "consent"); // Force consent to get refresh token
  } else if (provider === "slack") {
    // Slack uses user_scope for user tokens
    params.delete("scope");
    params.set("user_scope", config.scopes.join(","));
  } else if (provider === "discord") {
    params.set("prompt", "consent");
  }

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  provider: string,
  code: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType: string;
  scope?: string;
} | null> {
  const config = getProviderConfig(provider);
  const credentials = getClientCredentials(provider);

  if (!config || !credentials) return null;

  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    code,
    redirect_uri: getCallbackUrl(),
    grant_type: "authorization_code",
  });

  try {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Token exchange failed for ${provider}:`, errorText);
      return null;
    }

    const data = await response.json();

    // Handle Slack's different response format
    if (provider === "slack") {
      if (!data.ok) {
        console.error("Slack token exchange error:", data.error);
        return null;
      }
      return {
        accessToken: data.authed_user?.access_token || data.access_token,
        refreshToken: data.authed_user?.refresh_token,
        expiresIn: data.authed_user?.expires_in,
        tokenType: "Bearer",
        scope: data.authed_user?.scope || data.scope,
      };
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type || "Bearer",
      scope: data.scope,
    };
  } catch (error) {
    console.error(`Token exchange error for ${provider}:`, error);
    return null;
  }
}

/**
 * Fetch user info from provider
 */
export async function fetchUserInfo(
  provider: string,
  accessToken: string
): Promise<{
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
} | null> {
  const config = getProviderConfig(provider);
  if (!config?.userInfoUrl) return null;

  try {
    let url = config.userInfoUrl;
    let headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };

    // Slack uses a different auth method
    if (provider === "slack") {
      url = `${config.userInfoUrl}?token=${accessToken}`;
      headers = {};
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      console.error(`User info fetch failed for ${provider}:`, response.status);
      return null;
    }

    const data = await response.json();

    // Normalize response based on provider
    switch (provider) {
      case "gmail":
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          picture: data.picture,
        };

      case "outlook":
        return {
          id: data.id,
          email: data.mail || data.userPrincipalName,
          name: data.displayName,
        };

      case "slack":
        if (!data.ok) return null;
        return {
          id: data.user_id,
          email: data.user?.email,
          name: data.user?.name || data.user,
        };

      case "discord":
        return {
          id: data.id,
          email: data.email,
          name: data.username,
          picture: data.avatar
            ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
            : undefined,
        };

      case "zoom":
        return {
          id: data.id,
          email: data.email,
          name: `${data.first_name} ${data.last_name}`.trim(),
          picture: data.pic_url,
        };

      default:
        return data;
    }
  } catch (error) {
    console.error(`User info fetch error for ${provider}:`, error);
    return null;
  }
}

/**
 * Refresh an access token
 */
export async function refreshAccessToken(
  provider: string,
  refreshToken: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
} | null> {
  const config = getProviderConfig(provider);
  const credentials = getClientCredentials(provider);

  if (!config || !credentials) return null;

  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  try {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      console.error(`Token refresh failed for ${provider}:`, response.status);
      return null;
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token, // Some providers return a new refresh token
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error(`Token refresh error for ${provider}:`, error);
    return null;
  }
}

/**
 * Revoke tokens for a provider
 */
export async function revokeTokens(
  provider: string,
  accessToken: string
): Promise<boolean> {
  const config = getProviderConfig(provider);
  if (!config?.revokeUrl) return true; // No revoke endpoint, consider it successful

  const credentials = getClientCredentials(provider);

  try {
    const body = new URLSearchParams({ token: accessToken });

    // Discord requires client credentials
    if (provider === "discord" && credentials) {
      body.set("client_id", credentials.clientId);
      body.set("client_secret", credentials.clientSecret);
    }

    const response = await fetch(config.revokeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    return response.ok;
  } catch (error) {
    console.error(`Token revoke error for ${provider}:`, error);
    return false;
  }
}
