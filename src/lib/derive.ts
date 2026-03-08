import type { Section } from "@/types/section";
import type { Stage, Member } from "@/types/member";

export const STAGE_ORDER: Stage[] = [
  "pending", "entry", "foundation", "development", "showcase", "graduate",
];

export const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: "pending",     label: "Pending",     color: "rgba(255,255,255,0.18)" },
  { id: "entry",       label: "Entry",       color: "#3b4a3f" },
  { id: "foundation",  label: "Foundation",  color: "#2e3d52" },
  { id: "development", label: "Development", color: "#3d2e52" },
  { id: "showcase",    label: "Showcase",    color: "#52432e" },
  { id: "graduate",    label: "Graduate",    color: "#2e4a3d" },
];

export function getAcceptedCount(sections: Section[]): number {
  return sections.filter(s => s.status === "accepted").length;
}

export function getProgress(sections: Section[]): number {
  if (!sections.length) return 0;
  return Math.round((getAcceptedCount(sections) / sections.length) * 100);
}

export function computeRisk(
  member: Member,
  lastActivity: Date,
  currentWeek: number,
  totalWeeks: number,
): boolean {
  const daysSince = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
  const expectedByNow = Math.floor((currentWeek / totalWeeks) * member.sections);
  return member.accepted < 3 && daysSince > 10 && member.accepted < expectedByNow;
}

export function getNextStage(current: Stage): Stage | null {
  const idx = STAGE_ORDER.indexOf(current);
  return idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}

export function validateStageTransition(
  sections: Section[],
  toStage: Stage,
): { ok: boolean; reason?: string } {
  const cp1Required = ["practice", "focus", "material", "influences"] as const;
  const cp2Required = ["series", "exhibition", "collab"] as const;

  if (toStage === "foundation" || toStage === "development") {
    const required = toStage === "foundation" ? cp1Required : cp2Required;
    const allAccepted = required.every(
      key => sections.find(s => s.id === key)?.status === "accepted",
    );
    if (!allAccepted) {
      return { ok: false, reason: `Not all required sections accepted for ${toStage}` };
    }
  }
  return { ok: true };
}
