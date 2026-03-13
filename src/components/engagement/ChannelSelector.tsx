"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useC } from "@/hooks/useC";
import { SPF } from "@/lib/motion";

type Channel = {
  id: string;
  name: string;
};

type ChannelSelectorProps = {
  integrationId: string;
  integrationType: "slack" | "discord";
  engagementId: string;
  composioAccountId: string;
  onSave?: () => void;
};

export function ChannelSelector({
  integrationId,
  integrationType,
  engagementId,
  composioAccountId,
  onSave,
}: ChannelSelectorProps) {
  const C = useC();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available channels
  useEffect(() => {
    if (!composioAccountId) {
      setLoading(false);
      setError("No Composio account connected");
      return;
    }

    fetchChannels();
  }, [integrationId, integrationType, composioAccountId]);

  // Load existing selected channels
  useEffect(() => {
    loadExistingSelection();
  }, [integrationId, engagementId]);

  const fetchChannels = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/integrations/channels?integrationId=${integrationId}&type=${integrationType}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch channels");
      }

      setChannels(data.channels || []);
    } catch (err) {
      console.error("Failed to fetch channels:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch channels");
    } finally {
      setLoading(false);
    }
  };

  const loadExistingSelection = async () => {
    try {
      const res = await fetch(
        `/api/engagements/${engagementId}/integrations/${integrationId}`
      );
      if (res.ok) {
        const data = await res.json();
        const settings = data.integration?.settings || {};
        const existingIds =
          integrationType === "slack"
            ? settings.slackChannelIds || []
            : settings.discordChannelIds || [];
        setSelectedIds(existingIds);
      }
    } catch (err) {
      console.error("Failed to load existing selection:", err);
    }
  };

  const toggleChannel = (channelId: string) => {
    setSelectedIds((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  const selectAll = () => {
    setSelectedIds(channels.map((ch) => ch.id));
  };

  const selectNone = () => {
    setSelectedIds([]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const settingsKey =
        integrationType === "slack" ? "slackChannelIds" : "discordChannelIds";

      const res = await fetch(
        `/api/engagements/${engagementId}/integrations/${integrationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            settings: {
              [settingsKey]: selectedIds,
            },
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save channels");
      }

      onSave?.();
    } catch (err) {
      console.error("Failed to save channels:", err);
      setError(err instanceof Error ? err.message : "Failed to save channels");
    } finally {
      setSaving(false);
    }
  };

  const platformColor = integrationType === "slack" ? "#4A154B" : "#5865F2";
  const platformLabel = integrationType === "slack" ? "Slack" : "Discord";

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: "center",
          color: C.t3,
          fontSize: 13,
        }}
      >
        Loading {platformLabel} channels...
      </div>
    );
  }

  // Error state
  if (error && channels.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          background: "#ef444410",
          borderRadius: 8,
          border: "1px solid #ef444430",
        }}
      >
        <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 8 }}>
          {error}
        </div>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={fetchChannels}
          style={{
            padding: "8px 16px",
            background: C.void,
            border: `1px solid ${C.sep}`,
            borderRadius: 6,
            fontSize: 12,
            color: C.t2,
            cursor: "pointer",
          }}
        >
          Retry
        </motion.button>
      </div>
    );
  }

  // No channels found
  if (channels.length === 0) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: "center",
          color: C.t3,
          fontSize: 13,
        }}
      >
        No channels found. Make sure the {platformLabel} connection has the
        required permissions.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Header with select all/none */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 12, color: C.t3 }}>
          {selectedIds.length} of {channels.length} channels selected
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={selectAll}
            style={{
              background: "none",
              border: "none",
              fontSize: 11,
              color: C.blue,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Select all
          </button>
          <button
            onClick={selectNone}
            style={{
              background: "none",
              border: "none",
              fontSize: 11,
              color: C.t3,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Channel list */}
      <div
        style={{
          maxHeight: 280,
          overflowY: "auto",
          border: `1px solid ${C.sep}`,
          borderRadius: 8,
          background: C.void,
        }}
      >
        {channels.map((channel, index) => {
          const isSelected = selectedIds.includes(channel.id);
          return (
            <motion.div
              key={channel.id}
              whileTap={{ scale: 0.99 }}
              onClick={() => toggleChannel(channel.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderBottom:
                  index < channels.length - 1 ? `1px solid ${C.sep}` : "none",
                cursor: "pointer",
                background: isSelected ? `${platformColor}10` : "transparent",
                transition: "background .15s",
              }}
            >
              {/* Checkbox */}
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: `2px solid ${isSelected ? platformColor : C.sep}`,
                  background: isSelected ? platformColor : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all .15s",
                  flexShrink: 0,
                }}
              >
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={SPF}
                      style={{
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      &#10003;
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Channel name */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span style={{ color: C.t3, fontSize: 13 }}>#</span>
                <span
                  style={{
                    fontSize: 13,
                    color: C.t1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {channel.name}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: "8px 12px",
            background: "#ef444410",
            borderRadius: 6,
            fontSize: 11,
            color: "#ef4444",
          }}
        >
          {error}
        </div>
      )}

      {/* Save button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={saving}
        style={{
          width: "100%",
          padding: "12px 16px",
          background: platformColor,
          border: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          color: "#fff",
          cursor: saving ? "wait" : "pointer",
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? "Saving..." : `Save ${selectedIds.length} Channel${selectedIds.length !== 1 ? "s" : ""}`}
      </motion.button>
    </div>
  );
}
