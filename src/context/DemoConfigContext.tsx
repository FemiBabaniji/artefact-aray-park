"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { Pace, FieldType } from "@/types/room";

// Field definition for structured rooms
export type RoomFieldConfig = {
  fieldKey: string;
  label: string;
  fieldType: FieldType;
  options?: string[];     // for select fields
  required: boolean;
  order: number;
};

// Room configuration type (v2 - rooms are named spaces, members add blocks)
export type RoomConfig = {
  id: string;
  label: string;
  purpose?: string;       // instruction to the member
  pace: Pace;             // foundation | development | ongoing
  isPublic: boolean;
  isStructured: boolean;  // if true, shows form fields instead of block composer
  fields?: RoomFieldConfig[]; // only for structured rooms
  order: number;
};

// Legacy section config (for backwards compatibility)
export type SectionConfig = {
  id: string;
  label: string;
  cp: 1 | 2;
  order: number;
};

export type StageConfig = {
  id: string;
  label: string;
};

export type IdentityConfig = {
  name: string;
  tagline: string;
  accentColor: string;
  logoUrl: string | null;
};

export type DemoConfig = {
  identity: IdentityConfig;
  rooms: RoomConfig[];
  stages: StageConfig[];
  // Legacy - for backwards compatibility
  sections: SectionConfig[];
};

type DemoConfigContextValue = {
  config: DemoConfig;
  updateIdentity: (partial: Partial<IdentityConfig>) => void;
  updateRooms: (rooms: RoomConfig[]) => void;
  updateStages: (stages: StageConfig[]) => void;
  // Legacy
  updateSections: (sections: SectionConfig[]) => void;
  isSaving: boolean;
  showExpiryWarning: boolean;
  isExpired: boolean;
};

const DemoConfigCtx = createContext<DemoConfigContextValue | null>(null);

// Default room schema (v2 - rooms are named spaces, no types)
const DEFAULT_ROOMS: RoomConfig[] = [
  { id: "practice", label: "Your practice", purpose: "What is your practice and why do you make it?", pace: "foundation", isPublic: true, isStructured: false, order: 0 },
  { id: "focus", label: "What you're working on", purpose: "The specific project or question you're exploring right now", pace: "foundation", isPublic: true, isStructured: false, order: 1 },
  { id: "material", label: "Your materials", purpose: "What you work with and where you get it", pace: "foundation", isPublic: true, isStructured: false, order: 2 },
  { id: "influences", label: "Who shaped you", purpose: "Artists, thinkers, or movements that inform your work", pace: "foundation", isPublic: true, isStructured: false, order: 3 },
  { id: "references", label: "References", purpose: "Images, links, and references that inform your work", pace: "ongoing", isPublic: false, isStructured: false, order: 4 },
  { id: "series", label: "Your body of work", purpose: "The projects that belong together under this program", pace: "development", isPublic: true, isStructured: false, order: 5 },
  { id: "works", label: "Your work", purpose: "Documentation of finished pieces", pace: "development", isPublic: true, isStructured: false, order: 6 },
  { id: "showreel", label: "Showreel", purpose: "Link your primary video, audio, or interactive work", pace: "ongoing", isPublic: true, isStructured: false, order: 7 },
  { id: "exhibition", label: "Where you want to show", purpose: "The venues, contexts, or audiences you're working toward", pace: "development", isPublic: true, isStructured: false, order: 8 },
  { id: "collab", label: "Who you want to work with", purpose: "Collaborators, institutions, or communities you're reaching out to", pace: "development", isPublic: true, isStructured: false, order: 9 },
];

// Legacy section schema (for backwards compatibility)
const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: "practice", label: "Practice Statement", cp: 1, order: 0 },
  { id: "focus", label: "Current Focus", cp: 1, order: 1 },
  { id: "material", label: "Material Sourcing Plan", cp: 1, order: 2 },
  { id: "influences", label: "Influences & Context", cp: 1, order: 3 },
  { id: "series", label: "Project Series", cp: 2, order: 4 },
  { id: "exhibition", label: "Exhibition Goals", cp: 2, order: 5 },
  { id: "collab", label: "Collaboration Outreach", cp: 2, order: 6 },
];

// Default stage config
const DEFAULT_STAGES: StageConfig[] = [
  { id: "pending", label: "Pending" },
  { id: "entry", label: "Entry" },
  { id: "foundation", label: "Foundation" },
  { id: "development", label: "Development" },
  { id: "showcase", label: "Showcase" },
  { id: "graduate", label: "Graduate" },
];

const DEFAULT_IDENTITY: IdentityConfig = {
  name: "Your Community",
  tagline: "",
  accentColor: "#4ade80",
  logoUrl: null,
};

// Convert rooms to legacy sections for backwards compatibility
function roomsToSections(rooms: RoomConfig[]): SectionConfig[] {
  return rooms
    .filter((r) => !r.isStructured) // Non-structured rooms map to text sections
    .map((r) => ({
      id: r.id,
      label: r.label,
      cp: r.pace === "foundation" ? 1 : 2,
      order: r.order,
    })) as SectionConfig[];
}

// Convert legacy sections to rooms
function sectionsToRooms(sections: SectionConfig[]): RoomConfig[] {
  return sections.map((s) => ({
    id: s.id,
    label: s.label,
    pace: s.cp === 1 ? "foundation" : "development" as Pace,
    isPublic: true,
    isStructured: false,
    order: s.order,
  }));
}

type DemoConfigProviderProps = {
  children: ReactNode;
  token: string;
  expiresAt: string;
  initialConfig?: Partial<DemoConfig>;
};

export function DemoConfigProvider({
  children,
  token,
  expiresAt,
  initialConfig,
}: DemoConfigProviderProps) {
  // Merge initial config with defaults
  const [config, setConfig] = useState<DemoConfig>(() => {
    const rooms = initialConfig?.rooms?.length
      ? initialConfig.rooms
      : initialConfig?.sections?.length
      ? sectionsToRooms(initialConfig.sections)
      : DEFAULT_ROOMS;

    return {
      identity: { ...DEFAULT_IDENTITY, ...initialConfig?.identity },
      rooms,
      sections: roomsToSections(rooms),
      stages: initialConfig?.stages?.length
        ? initialConfig.stages
        : DEFAULT_STAGES,
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  // Debounce timer ref
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced save to API
  const debouncedSave = useCallback(
    async (newConfig: DemoConfig) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await Promise.all([
            fetch(`/api/demo/${token}/community`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: newConfig.identity.name,
                tagline: newConfig.identity.tagline,
                accent_color: newConfig.identity.accentColor,
                logo_url: newConfig.identity.logoUrl,
              }),
            }),
            fetch(`/api/demo/${token}/program`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                room_schema: newConfig.rooms,
                // Also send legacy format for backwards compat
                section_schema: newConfig.sections,
                stage_config: newConfig.stages,
              }),
            }),
          ]);
        } catch (error) {
          console.error("Failed to save demo config:", error);
        } finally {
          setIsSaving(false);
        }
      }, 800);
    },
    [token]
  );

  // Update functions
  const updateIdentity = useCallback(
    (partial: Partial<IdentityConfig>) => {
      setConfig((prev) => {
        const newConfig = {
          ...prev,
          identity: { ...prev.identity, ...partial },
        };
        debouncedSave(newConfig);
        return newConfig;
      });
    },
    [debouncedSave]
  );

  const updateRooms = useCallback(
    (rooms: RoomConfig[]) => {
      setConfig((prev) => {
        const newConfig = {
          ...prev,
          rooms,
          sections: roomsToSections(rooms),
        };
        debouncedSave(newConfig);
        return newConfig;
      });
    },
    [debouncedSave]
  );

  // Legacy - converts sections to rooms
  const updateSections = useCallback(
    (sections: SectionConfig[]) => {
      const rooms = sectionsToRooms(sections);
      updateRooms(rooms);
    },
    [updateRooms]
  );

  const updateStages = useCallback(
    (stages: StageConfig[]) => {
      setConfig((prev) => {
        const newConfig = { ...prev, stages };
        debouncedSave(newConfig);
        return newConfig;
      });
    },
    [debouncedSave]
  );

  // Expiry timers
  useEffect(() => {
    const msUntilExpiry = new Date(expiresAt).getTime() - Date.now();

    if (msUntilExpiry <= 0) {
      setIsExpired(true);
      return;
    }

    const warnAt = msUntilExpiry - 10 * 60 * 1000;

    const warnTimer =
      warnAt > 0
        ? setTimeout(() => setShowExpiryWarning(true), warnAt)
        : undefined;
    const expireTimer = setTimeout(() => setIsExpired(true), msUntilExpiry);

    return () => {
      if (warnTimer) clearTimeout(warnTimer);
      clearTimeout(expireTimer);
    };
  }, [expiresAt]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const value: DemoConfigContextValue = {
    config,
    updateIdentity,
    updateRooms,
    updateSections,
    updateStages,
    isSaving,
    showExpiryWarning,
    isExpired,
  };

  return (
    <DemoConfigCtx.Provider value={value}>{children}</DemoConfigCtx.Provider>
  );
}

export function useDemoConfig() {
  const ctx = useContext(DemoConfigCtx);
  if (!ctx) {
    throw new Error("useDemoConfig must be used within DemoConfigProvider");
  }
  return ctx;
}

// Export defaults for use elsewhere
export { DEFAULT_ROOMS, DEFAULT_SECTIONS, DEFAULT_STAGES, DEFAULT_IDENTITY };
