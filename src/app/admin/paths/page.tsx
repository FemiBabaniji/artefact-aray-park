import { getMembers, getSections } from "@/lib/data/members";
import { StepPaths } from "@/components/paths/StepPaths";

export default async function AdminPathsPage() {
  const members = await getMembers();

  const membersWithSections = await Promise.all(
    members.map(async m => ({
      member:   m,
      sections: await getSections(m.id),
    }))
  );

  return <StepPaths members={membersWithSections} />;
}
