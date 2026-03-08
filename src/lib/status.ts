import type { ThemeTokens } from "./tokens";
import type { SectionStatus } from "@/types/section";

export type StatusToken = {
  dot:   string;
  label: string;
  color: string;
};

export function mkST(C: ThemeTokens): Record<SectionStatus, StatusToken> {
  return {
    empty:       { dot: C.sep,     label: "empty",       color: C.t3      },
    in_progress: { dot: C.amber,   label: "in progress", color: C.amber   },
    submitted:   { dot: C.blue,    label: "submitted",   color: C.blue    },
    reviewed:    { dot: "#d97706", label: "reviewed",    color: "#d97706" },
    accepted:    { dot: C.green,   label: "accepted",    color: C.green   },
  };
}
