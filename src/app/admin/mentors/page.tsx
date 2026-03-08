import { getMembers } from "@/lib/data/members";
import { MentorAssignmentClient } from "./client";

export default async function AdminMentorsPage() {
  const members = await getMembers();

  // In production, filter by role from community_roles table
  // For now, use first 2 members as mock mentors
  const mentors = members.slice(0, 2).map(m => ({
    id: m.id,
    name: m.name,
    initials: m.initials,
    color: m.color,
  }));

  const allMembers = members.map(m => ({
    id: m.id,
    name: m.name,
    initials: m.initials,
    color: m.color,
  }));

  return <MentorAssignmentClient mentors={mentors} members={allMembers} />;
}
