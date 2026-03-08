import { getMember, getSections } from "@/lib/data/members";
import { StepLink } from "@/components/link/StepLink";
import { notFound } from "next/navigation";

type Props = { params: { memberId: string } };

export default async function LinkPage({ params }: Props) {
  const [member, sections] = await Promise.all([
    getMember(params.memberId),
    getSections(params.memberId),
  ]);

  if (!member) notFound();

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <StepLink member={member} sections={sections} />
    </div>
  );
}
