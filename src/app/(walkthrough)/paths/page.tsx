import { getMembers, getSections } from "@/lib/data/members";
import { StepPaths } from "@/components/paths/StepPaths";

export default async function PathsPage() {
  const members = await getMembers();

  // Get sections for each member
  const membersWithSections = await Promise.all(
    members.map(async m => ({
      member:   m,
      sections: await getSections(m.id),
    }))
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <StepPaths members={membersWithSections} />
    </div>
  );
}
