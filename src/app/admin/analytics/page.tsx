import { getMembers, getSections } from "@/lib/data/members";
import { getProgram } from "@/lib/data/members";
import { AnalyticsView } from "@/components/admin/AnalyticsView";

export default async function AdminAnalyticsPage() {
  const members = await getMembers();
  const program = await getProgram();

  const membersWithSections = await Promise.all(
    members.map(async m => ({
      member: m,
      sections: await getSections(m.id),
    }))
  );

  return (
    <AnalyticsView
      members={membersWithSections}
      programWeek={program?.week}
      totalWeeks={program?.totalWeeks}
    />
  );
}
