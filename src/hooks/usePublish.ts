"use client";

import { useState, useCallback } from "react";
import type { Identity, StandaloneRoom } from "@/types/artefact";

type PublishState = {
  status: "idle" | "publishing" | "success" | "error" | "auth_required";
  slug?: string;
  publicUrl?: string;
  error?: string;
};

type PublishResult = {
  success: boolean;
  artefactId?: string;
  slug?: string;
  publicUrl?: string;
  message?: string;
  authRequired?: boolean;
};

export function usePublish() {
  const [state, setState] = useState<PublishState>({ status: "idle" });

  const publish = useCallback(
    async (identity: Identity, rooms: StandaloneRoom[], requestedSlug?: string): Promise<PublishResult> => {
      setState({ status: "publishing" });

      try {
        const response = await fetch("/api/artefact/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identity, rooms, slug: requestedSlug }),
        });

        const result = await response.json();

        // Handle authentication required
        if (response.status === 401) {
          setState({
            status: "auth_required",
            error: result.message || "Please sign in to publish"
          });
          return { ...result, authRequired: true };
        }

        if (result.success) {
          setState({
            status: "success",
            slug: result.slug,
            publicUrl: result.publicUrl,
          });
          return result;
        } else {
          setState({ status: "error", error: result.message || "Failed to publish" });
          return result;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Network error";
        setState({ status: "error", error: message });
        return { success: false, message };
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return {
    ...state,
    publish,
    reset,
    isPublishing: state.status === "publishing",
    isPublished: state.status === "success",
    requiresAuth: state.status === "auth_required",
  };
}
