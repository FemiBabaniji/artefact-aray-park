"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ThemeProvider } from "@/context/ThemeProvider";
import { PublicArtefactView } from "@/components/create/PublicArtefactView";
import { useC } from "@/hooks/useC";
import type { StandaloneArtefact, GuestArtefactState } from "@/types/artefact";
import { GUEST_STORAGE_KEY } from "@/lib/guest/defaults";

// Preview page for now - reads from localStorage
// TODO: Integrate with Supabase after claim flow is implemented

export default function PublicArtefactPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [artefact, setArtefact] = useState<StandaloneArtefact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadArtefact() {
      // For "preview" slug, load from localStorage (guest preview)
      if (slug === "preview") {
        try {
          const stored = localStorage.getItem(GUEST_STORAGE_KEY);
          if (stored) {
            const guest: GuestArtefactState = JSON.parse(stored);
            setArtefact({
              id: guest.sessionId,
              identity: guest.identity,
              rooms: guest.rooms,
              createdAt: guest.createdAt,
              updatedAt: new Date().toISOString(),
            });
          } else {
            setError("No artefact data found. Start editing at /create first.");
          }
        } catch {
          setError("Failed to load artefact data.");
        }
        setLoading(false);
        return;
      }

      // Fetch from API for published artefacts
      try {
        const res = await fetch(`/api/artefact/${slug}?format=context`);
        if (!res.ok) {
          setError("Artefact not found.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        // Transform API response to StandaloneArtefact format
        setArtefact({
          id: slug,
          slug: slug,
          identity: data.identity,
          rooms: (data.rooms || []).map((r: { key: string; label: string; blocks: { type: string; content: Record<string, unknown> }[] }, i: number) => ({
            id: r.key,
            key: r.key,
            label: r.label,
            visibility: "public" as const,
            orderIndex: i,
            blocks: (r.blocks || []).map((b: { type: string; content: Record<string, unknown> }, j: number) => ({
              id: `${r.key}-${j}`,
              blockType: b.type,
              content: b.content.body || "",
              metadata: b.content,
              orderIndex: j,
            })),
          })),
          createdAt: data.generatedAt || new Date().toISOString(),
          updatedAt: data.generatedAt || new Date().toISOString(),
        });
      } catch {
        setError("Failed to load artefact.");
      }
      setLoading(false);
    }

    loadArtefact();
  }, [slug]);

  return (
    <ThemeProvider>
      <PageContent artefact={artefact} loading={loading} error={error} />
    </ThemeProvider>
  );
}

function PageContent({
  artefact,
  loading,
  error,
}: {
  artefact: StandaloneArtefact | null;
  loading: boolean;
  error: string | null;
}) {
  const C = useC();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: C.void,
          color: C.t3,
        }}
      >
        Loading...
      </div>
    );
  }

  if (error || !artefact) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: C.void,
          gap: 16,
        }}
      >
        <div style={{ fontSize: 14, color: C.t2 }}>{error || "Not found"}</div>
        <a
          href="/create"
          style={{
            fontSize: 12,
            color: C.blue,
            textDecoration: "none",
          }}
        >
          Create an artefact →
        </a>
      </div>
    );
  }

  return <PublicArtefactView artefact={artefact} />;
}
