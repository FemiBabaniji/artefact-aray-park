import { getMember, getSections } from "@/lib/data/members";
import { StepPortal } from "@/components/portal/StepPortal";
import { redirect } from "next/navigation";

export default async function PortalPage() {
  // In production, this would get the authenticated user's member ID
  // For demo, we use "am" (Ava Martinez)
  const memberId = "am";

  const [member, sections] = await Promise.all([
    getMember(memberId),
    getSections(memberId),
  ]);

  if (!member) {
    redirect("/apply");
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <StepPortal member={member} sections={sections} />
    </div>
  );
}
