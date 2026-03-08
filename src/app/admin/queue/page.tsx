import { getMembers, getSections } from "@/lib/data/members";
import { StepQueue } from "@/components/queue/StepQueue";

export default async function AdminQueuePage() {
  const members = await getMembers();

  const applicants = await Promise.all(
    members.slice(0, 4).map(async (m, i) => ({
      id:       m.id,
      member:   m,
      sections: await getSections(m.id),
      date:     `Mar ${5 - i}`,
    }))
  );

  return <StepQueue applicants={applicants} />;
}
