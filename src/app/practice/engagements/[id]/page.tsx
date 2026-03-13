"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { EngagementDashboard } from "@/components/engagement";
import type { Engagement, EngagementPhase } from "@/types/engagement";
import type { Participant } from "@/types/participant";

// Mock owner for demo
const DEMO_OWNER_ID = "demo-user-123";

type EngagementWithDetails = Engagement & {
  client?: { id: string; name: string; logoUrl?: string } | null;
  participants: Participant[];
  events: Array<{ id: string; event_type: string; payload: unknown; actor_id: string; created_at: string }>;
  phaseTransitions: Array<{ id: string; from_phase: string | null; to_phase: string; created_at: string }>;
};

export default function EngagementPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [engagement, setEngagement] = useState<EngagementWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEngagement() {
      try {
        const res = await fetch(`/api/engagements/${resolvedParams.id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Engagement not found");
          } else {
            setError("Failed to load engagement");
          }
          return;
        }
        const data = await res.json();
        setEngagement(data.engagement);
      } catch (err) {
        setError("Failed to load engagement");
      } finally {
        setLoading(false);
      }
    }
    fetchEngagement();
  }, [resolvedParams.id]);

  const handlePhaseChange = async (toPhase: EngagementPhase) => {
    if (!engagement) return;

    try {
      const res = await fetch(`/api/engagements/${engagement.id}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPhase,
          actorId: DEMO_OWNER_ID,
        }),
      });

      if (res.ok) {
        // Refresh engagement data
        const refreshRes = await fetch(`/api/engagements/${engagement.id}`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setEngagement(data.engagement);
        }
      }
    } catch (err) {
      console.error("Failed to change phase:", err);
    }
  };

  const handleInvite = () => {
    // TODO: Open invite modal
    console.log("Open invite modal");
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#888",
        }}
      >
        Loading...
      </div>
    );
  }

  if (error || !engagement) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#888",
          gap: 16,
        }}
      >
        <div>{error || "Engagement not found"}</div>
        <button
          onClick={() => router.push("/practice")}
          style={{
            padding: "8px 16px",
            background: "#333",
            border: "none",
            borderRadius: 6,
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Back to practice
        </button>
      </div>
    );
  }

  return (
    <EngagementDashboard
      engagement={engagement}
      onPhaseChange={handlePhaseChange}
      onInvite={handleInvite}
    />
  );
}
