"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";
import { ChannelSelector } from "@/components/engagement/ChannelSelector";

type IntegrationSettings = {
  connectionStatus?: "connected" | "disconnected" | "error" | "pending";
  connectedEmail?: string;
  userEmail?: string; // Composio stores email here
  connectedName?: string;
  userName?: string; // Composio stores name here
  lastError?: string;
  error?: string; // Composio stores error here
  slackChannelIds?: string[];
  discordChannelIds?: string[];
  composioAccountId?: string;
};

type Integration = {
  id?: string;
  type: "gmail" | "outlook" | "slack" | "discord" | "meeting";
  isEnabled: boolean;
  autoIngest: boolean;
  clientDomains: string[];
  settings: IntegrationSettings;
  lastSyncAt?: string;
};

type IntegrationSettingsProps = {
  engagementId: string;
  engagementSlug: string;
};

const INTEGRATION_CONFIG = {
  gmail: {
    label: "Gmail",
    description: "Auto-capture client emails",
    icon: "M",
    color: "#EA4335",
    fields: ["clientDomains"],
    oauthProvider: "gmail",
  },
  outlook: {
    label: "Outlook",
    description: "Auto-capture client emails",
    icon: "O",
    color: "#0078D4",
    fields: ["clientDomains"],
    oauthProvider: "outlook",
  },
  slack: {
    label: "Slack",
    description: "Monitor client channels",
    icon: "S",
    color: "#4A154B",
    fields: ["channelId"],
    oauthProvider: "slack",
  },
  discord: {
    label: "Discord",
    description: "Monitor team discussions",
    icon: "D",
    color: "#5865F2",
    fields: ["serverId", "channelId"],
    oauthProvider: "discord",
  },
  meeting: {
    label: "Meetings",
    description: "Auto-capture Zoom/Meet transcripts",
    icon: "V",
    color: "#2D8CFF",
    fields: [],
    oauthProvider: "zoom",
  },
};

export function IntegrationSettings({
  engagementId,
  engagementSlug,
}: IntegrationSettingsProps) {
  const C = useC();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [domainInput, setDomainInput] = useState("");

  // Fetch integrations
  useEffect(() => {
    fetchIntegrations();
  }, [engagementId]);

  // Check for OAuth success/error in URL (handles both legacy and Composio callbacks)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("oauth");
    const connected = params.get("integration_connected");
    const error = params.get("error");

    if (oauthStatus || connected || error) {
      // Refresh integrations after OAuth
      fetchIntegrations();
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete("oauth");
      url.searchParams.delete("integration");
      url.searchParams.delete("integration_connected");
      url.searchParams.delete("error");
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch(`/api/engagements/${engagementId}/integrations`);
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || []);
      }
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
    } finally {
      setLoading(false);
    }
  };

  const getIntegration = (type: string): Integration | undefined => {
    return integrations.find((i) => i.type === type);
  };

  const isConnected = (integration: Integration | undefined): boolean => {
    return integration?.settings?.connectionStatus === "connected";
  };

  const startOAuth = (type: keyof typeof INTEGRATION_CONFIG) => {
    const config = INTEGRATION_CONFIG[type];
    const returnUrl = encodeURIComponent(window.location.pathname);
    const integration = getIntegration(type);
    const integrationId = integration?.id ? `&integrationId=${integration.id}` : "";

    window.location.href = `/api/integrations/oauth/${config.oauthProvider}?engagementId=${engagementId}&returnUrl=${returnUrl}${integrationId}`;
  };

  const disconnectIntegration = async (type: string) => {
    const integration = getIntegration(type);
    if (!integration?.id) return;

    setSaving(type);
    try {
      await fetch(
        `/api/engagements/${engagementId}/integrations/${integration.id}/disconnect`,
        { method: "POST" }
      );
      await fetchIntegrations();
    } catch (err) {
      console.error("Failed to disconnect:", err);
    } finally {
      setSaving(null);
    }
  };

  const syncIntegration = async (type: string) => {
    const integration = getIntegration(type);
    if (!integration?.id) return;

    setSyncing(type);
    try {
      const res = await fetch(
        `/api/engagements/${engagementId}/integrations/${integration.id}/sync`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        await fetchIntegrations();
      } else {
        console.error("Sync failed:", data.error);
      }
    } catch (err) {
      console.error("Failed to sync:", err);
    } finally {
      setSyncing(null);
    }
  };

  const toggleAutoIngest = async (type: string) => {
    const existing = getIntegration(type);
    if (!existing?.id) return;

    setSaving(type);
    try {
      await fetch(`/api/engagements/${engagementId}/integrations/${existing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoIngest: !existing.autoIngest }),
      });
      await fetchIntegrations();
    } catch (err) {
      console.error("Failed to toggle auto-ingest:", err);
    } finally {
      setSaving(null);
    }
  };

  const addDomain = async (type: string) => {
    const existing = getIntegration(type);
    if (!existing?.id || !domainInput.trim()) return;

    const newDomains = [...(existing.clientDomains || []), domainInput.trim().toLowerCase()];
    setSaving(type);

    try {
      await fetch(`/api/engagements/${engagementId}/integrations/${existing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientDomains: newDomains }),
      });
      setDomainInput("");
      await fetchIntegrations();
    } catch (err) {
      console.error("Failed to add domain:", err);
    } finally {
      setSaving(null);
    }
  };

  const removeDomain = async (type: string, domain: string) => {
    const existing = getIntegration(type);
    if (!existing?.id) return;

    const newDomains = existing.clientDomains.filter((d) => d !== domain);
    setSaving(type);

    try {
      await fetch(`/api/engagements/${engagementId}/integrations/${existing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientDomains: newDomains }),
      });
      await fetchIntegrations();
    } catch (err) {
      console.error("Failed to remove domain:", err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: C.t4 }}>
        Loading integrations...
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {(Object.keys(INTEGRATION_CONFIG) as Array<keyof typeof INTEGRATION_CONFIG>).map((type) => {
        const config = INTEGRATION_CONFIG[type];
        const integration = getIntegration(type);
        const connected = isConnected(integration);
        const isExpanded = expandedType === type;
        const isSaving = saving === type;
        const isSyncing = syncing === type;
        const connectionStatus = integration?.settings?.connectionStatus;

        return (
          <motion.div
            key={type}
            layout
            style={{
              background: C.bg,
              border: `1px solid ${connected ? `${config.color}40` : C.sep}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
              onClick={() => setExpandedType(isExpanded ? null : type)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: `${config.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: config.color,
                  }}
                >
                  {config.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.t1 }}>
                    {config.label}
                  </div>
                  <div style={{ fontSize: 11, color: C.t3 }}>
                    {connected && (integration?.settings?.connectedEmail || integration?.settings?.userEmail)
                      ? (integration.settings.connectedEmail || integration.settings.userEmail)
                      : config.description}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Connection status badge */}
                {connectionStatus === "connected" && (
                  <span
                    style={{
                      padding: "3px 8px",
                      background: `${C.green}15`,
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 500,
                      color: C.green,
                    }}
                  >
                    Connected
                  </span>
                )}
                {connectionStatus === "error" && (
                  <span
                    style={{
                      padding: "3px 8px",
                      background: "#ef444415",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 500,
                      color: "#ef4444",
                    }}
                  >
                    Error
                  </span>
                )}
                {connectionStatus === "pending" && (
                  <span
                    style={{
                      padding: "3px 8px",
                      background: `${C.amber}15`,
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 500,
                      color: C.amber,
                    }}
                  >
                    Connecting...
                  </span>
                )}

                {integration?.lastSyncAt && (
                  <span style={{ fontSize: 10, color: C.t4 }}>
                    Synced {new Date(integration.lastSyncAt).toLocaleDateString()}
                  </span>
                )}

                {/* Expand arrow */}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  style={{ color: C.t3, fontSize: 12 }}
                >
                  ▼
                </motion.div>
              </div>
            </div>

            {/* Expanded Settings */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={SPF}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    style={{
                      padding: "0 16px 16px",
                      borderTop: `1px solid ${C.sep}`,
                      paddingTop: 16,
                    }}
                  >
                    {/* Not connected - show Connect button */}
                    {!connected && (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          startOAuth(type);
                        }}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          background: config.color,
                          border: "none",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#fff",
                          cursor: "pointer",
                          marginBottom: 16,
                        }}
                      >
                        Connect {config.label}
                      </motion.button>
                    )}

                    {/* Connected - show settings */}
                    {connected && (
                      <>
                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              syncIntegration(type);
                            }}
                            disabled={isSyncing}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              background: C.blue,
                              border: "none",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 500,
                              color: "#fff",
                              cursor: isSyncing ? "wait" : "pointer",
                              opacity: isSyncing ? 0.7 : 1,
                            }}
                          >
                            {isSyncing ? "Syncing..." : "Sync Now"}
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              disconnectIntegration(type);
                            }}
                            disabled={isSaving}
                            style={{
                              padding: "8px 12px",
                              background: "transparent",
                              border: `1px solid ${C.sep}`,
                              borderRadius: 6,
                              fontSize: 12,
                              color: C.t2,
                              cursor: isSaving ? "wait" : "pointer",
                            }}
                          >
                            Disconnect
                          </motion.button>
                        </div>

                        {/* Auto-ingest toggle */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 16,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: C.t1 }}>
                              Auto-ingest
                            </div>
                            <div style={{ fontSize: 11, color: C.t3 }}>
                              Automatically add to engagement without approval
                            </div>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAutoIngest(type);
                            }}
                            disabled={isSaving}
                            style={{
                              width: 36,
                              height: 20,
                              borderRadius: 10,
                              background: integration?.autoIngest ? C.green : C.sep,
                              border: "none",
                              cursor: isSaving ? "wait" : "pointer",
                              position: "relative",
                            }}
                          >
                            <motion.div
                              animate={{ x: integration?.autoIngest ? 16 : 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              style={{
                                position: "absolute",
                                top: 2,
                                left: 2,
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                background: "#fff",
                              }}
                            />
                          </motion.button>
                        </div>

                        {/* Channel selector (for Slack/Discord) */}
                        {(type === "slack" || type === "discord") && integration?.id && integration.settings.composioAccountId && (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: C.t1, marginBottom: 8 }}>
                              Channels to monitor
                            </div>
                            <ChannelSelector
                              integrationId={integration.id}
                              integrationType={type}
                              engagementId={engagementId}
                              composioAccountId={integration.settings.composioAccountId}
                              onSave={fetchIntegrations}
                            />
                          </div>
                        )}

                        {/* Client domains (for email) */}
                        {(type === "gmail" || type === "outlook") && (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: C.t1, marginBottom: 8 }}>
                              Client domains to monitor
                            </div>
                            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                              <input
                                type="text"
                                value={domainInput}
                                onChange={(e) => setDomainInput(e.target.value)}
                                placeholder="acme.com"
                                onKeyDown={(e) => e.key === "Enter" && addDomain(type)}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  flex: 1,
                                  padding: "8px 12px",
                                  background: C.void,
                                  border: `1px solid ${C.sep}`,
                                  borderRadius: 6,
                                  fontSize: 12,
                                  color: C.t1,
                                  outline: "none",
                                }}
                              />
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addDomain(type);
                                }}
                                disabled={!domainInput.trim()}
                                style={{
                                  padding: "8px 14px",
                                  background: C.blue,
                                  border: "none",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  color: "#fff",
                                  cursor: !domainInput.trim() ? "not-allowed" : "pointer",
                                  opacity: !domainInput.trim() ? 0.5 : 1,
                                }}
                              >
                                Add
                              </motion.button>
                            </div>

                            {/* Domain list */}
                            {integration?.clientDomains && integration.clientDomains.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {integration.clientDomains.map((domain) => (
                                  <div
                                    key={domain}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      padding: "4px 8px 4px 10px",
                                      background: `${config.color}15`,
                                      borderRadius: 4,
                                      fontSize: 11,
                                      color: C.t1,
                                    }}
                                  >
                                    {domain}
                                    <motion.button
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeDomain(type, domain);
                                      }}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: C.t3,
                                        cursor: "pointer",
                                        padding: 0,
                                        fontSize: 14,
                                        lineHeight: 1,
                                      }}
                                    >
                                      ×
                                    </motion.button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Error message */}
                        {(integration?.settings?.lastError || integration?.settings?.error) && (
                          <div
                            style={{
                              marginTop: 12,
                              padding: "8px 12px",
                              background: "#ef444410",
                              borderRadius: 6,
                              fontSize: 11,
                              color: "#ef4444",
                            }}
                          >
                            {integration.settings.lastError || integration.settings.error}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
