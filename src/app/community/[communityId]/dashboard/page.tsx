import {
  getCommunity,
  getCommunityMembers,
  getActivityFeed,
  getAlerts,
  getDashboardStats,
  getCohortProgressMap,
} from "@/lib/data/community";
import { CommunityDashboardWrapper } from "@/components/community/dashboard/CommunityDashboardWrapper";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ communityId: string }>;
};

export default async function CommunityDashboardPage({ params }: Props) {
  const { communityId } = await params;

  const [community, members, activity, alerts, stats, progressMap] = await Promise.all([
    getCommunity(communityId),
    getCommunityMembers(communityId),
    getActivityFeed(communityId, 10),
    getAlerts(communityId),
    getDashboardStats(communityId),
    getCohortProgressMap(communityId),
  ]);

  if (!community) {
    notFound();
  }

  return (
    <CommunityDashboardWrapper
      community={community}
      members={members}
      activity={activity}
      alerts={alerts}
      stats={stats}
      progressMap={progressMap}
    />
  );
}
