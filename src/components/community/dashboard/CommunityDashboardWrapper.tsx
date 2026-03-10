"use client";

import { ThemeProvider } from "@/context/ThemeProvider";
import { useC } from "@/hooks/useC";
import { CommunityDashboard } from "./CommunityDashboard";
import type {
  CommunityConfig,
  DashboardMember,
  ActivityItem,
  Alert,
  DashboardStats,
  CohortProgressMap,
} from "@/types/community";

type Props = {
  community: CommunityConfig;
  members: DashboardMember[];
  activity: ActivityItem[];
  alerts: Alert[];
  stats: DashboardStats;
  progressMap: CohortProgressMap;
};

function DashboardContent(props: Props) {
  const C = useC();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: C.void,
      }}
    >
      <CommunityDashboard {...props} />
    </div>
  );
}

export function CommunityDashboardWrapper(props: Props) {
  return (
    <ThemeProvider>
      <DashboardContent {...props} />
    </ThemeProvider>
  );
}
