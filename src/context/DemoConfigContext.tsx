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

// Types for demo configuration
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
  sections: SectionConfig[];
  stages: StageConfig[];
};

type DemoConfigContextValue = {
  config: DemoConfig;
  updateIdentity: (partial: Partial<IdentityConfig>) => void;
  updateSections: (sections: SectionConfig[]) => void;
  updateStages: (stages: StageConfig[]) => void;
  isSaving: boolean;
  showExpiryWarning: boolean;
  isExpired: boolean;
};

const DemoConfigCtx = createContext<DemoConfigContextValue | null>(null);

// Default section schema matching INIT from seed.ts
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
  const [config, setConfig] = useState<DemoConfig>(() => ({
    identity: { ...DEFAULT_IDENTITY, ...initialConfig?.identity },
    sections: initialConfig?.sections?.length
      ? initialConfig.sections
      : DEFAULT_SECTIONS,
    stages: initialConfig?.stages?.length
      ? initialConfig.stages
      : DEFAULT_STAGES,
  }));

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

  const updateSections = useCallback(
    (sections: SectionConfig[]) => {
      setConfig((prev) => {
        const newConfig = { ...prev, sections };
        debouncedSave(newConfig);
        return newConfig;
      });
    },
    [debouncedSave]
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

    const warnAt = msUntilExpiry - 10 * 60 * 1000; // 10 min before expiry

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
export { DEFAULT_SECTIONS, DEFAULT_STAGES, DEFAULT_IDENTITY };
