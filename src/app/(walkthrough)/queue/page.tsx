import { getMembers, getSections } from "@/lib/data/members";
import { StepQueue } from "@/components/queue/StepQueue";

export default async function QueuePage() {
  const members = await getMembers();

  // Build applicants with their sections
  const applicants = await Promise.all(
    members.slice(0, 4).map(async (m, i) => ({
      id:       m.id,
      member:   m,
      sections: await getSections(m.id),
      date:     `Mar ${5 - i}`,
    }))
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <StepQueue applicants={applicants} />
    </div>
  );
}
