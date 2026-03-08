import { getMembers } from "@/lib/data/members";
import { StepCommunity } from "@/components/community/StepCommunity";

export default async function CommunityPage() {
  const members = await getMembers();

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <StepCommunity members={members} />
    </div>
  );
}
