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

      // TODO: For real slugs, fetch from Supabase
      // const { data, error } = await supabase
      //   .from("artefacts")
      //   .select("*, rooms(*, blocks(*))")
      //   .eq("slug", slug)
      //   .single();

      // For now, show not found for non-preview slugs
      setError("Artefact not found. The claim flow is not yet implemented.");
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
