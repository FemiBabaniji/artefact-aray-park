import { getMembers } from "@/lib/data/members";
import { StepCommunity } from "@/components/community/StepCommunity";

export default async function AdminCommunityPage() {
  const members = await getMembers();

  return <StepCommunity members={members} />;
}
