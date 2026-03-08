import type { ThemeTokens } from "./tokens";
import type { RoomStatus, RoomStatusV2 } from "@/types/room";

export type StatusToken = {
  dot:   string;
  label: string;
  color: string;
};

// Combined status type for both legacy and v2
export type AnyStatus = RoomStatus | RoomStatusV2;

export function mkST(C: ThemeTokens): Record<AnyStatus, StatusToken> {
  return {
    // Legacy statuses
    empty:       { dot: C.sep,     label: "empty",       color: C.t3      },
    in_progress: { dot: C.amber,   label: "in progress", color: C.amber   },
    submitted:   { dot: C.blue,    label: "submitted",   color: C.blue    },
    reviewed:    { dot: "#d97706", label: "reviewed",    color: "#d97706" },
    accepted:    { dot: C.green,   label: "accepted",    color: C.green   },
    ongoing:     { dot: C.t3,      label: "ongoing",     color: C.t3      },
    // v2 statuses
    active:      { dot: C.amber,   label: "active",      color: C.amber   },
    feedback:    { dot: "#d97706", label: "feedback",    color: "#d97706" },
    complete:    { dot: C.green,   label: "complete",    color: C.green   },
  };
}

// Legacy alias for backwards compatibility
export type SectionStatus = RoomStatus;
