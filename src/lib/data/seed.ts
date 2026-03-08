// Stub data matching prototype constants exactly.
// Replace each function body with a Prisma query when the DB is ready.

import type { Section } from "@/types/section";
import type { Member } from "@/types/member";
import type { Program } from "@/types/program";

export const INIT: Section[] = [
  { id: "practice",   label: "Practice Statement",    status: "accepted",    evidence: "I build environments that hold a feeling…", cp: 1, feedback: "Strong opening. The light-as-material framing is distinctive. Consider adding one concrete example of a past work that embodies this.", feedbackAt: "Feb 28" },
  { id: "focus",      label: "Current Focus",          status: "submitted",   evidence: "Bioluminescent systems + civic space",        cp: 1 },
  { id: "material",   label: "Material Sourcing Plan", status: "in_progress", evidence: "",                                            cp: 1 },
  { id: "influences", label: "Influences & Context",   status: "accepted",    evidence: "Turrell, Eliasson, Hamilton",                  cp: 1, feedback: "Good range. Could you add one less-obvious influence to show independent thinking?", feedbackAt: "Mar 1" },
  { id: "series",     label: "Project Series",          status: "in_progress", evidence: "",                                            cp: 2 },
  { id: "exhibition", label: "Exhibition Goals",        status: "empty",       evidence: "",                                            cp: 2 },
  { id: "collab",     label: "Collaboration Outreach",  status: "empty",       evidence: "",                                            cp: 2 },
];

export const MEMBERS: Member[] = [
  {
    id: "am", name: "Ava Martinez",     initials: "AM", title: "Visual Artist & Spatial Designer",
    email: "ava@avamartinez.studio",    phone: "+1 416 555 0192",
    location: "Toronto, ON",            color: "#3b4f42",
    stage: "foundation", risk: false, sections: 7, accepted: 2,
    profile: {
      practice:     "I build environments that hold a feeling. Each project begins with a question: what does this space want to remember? Light as primary material — shifting perceptual ground beneath a viewer's feet.",
      focus:        "Currently developing a new body of work around bioluminescent systems and civic space.",
      goals:        ["International exhibition presence", "Bioluminescent materials research", "Urban planner collaborations"],
      influences:   ["James Turrell", "Olafur Eliasson", "Ann Hamilton", "Rirkrit Tiravanija"],
      availability: "open to residencies & commissions",
      skills: {
        Primary: ["Environmental Design", "Light Sculpture", "Spatial Narrative"],
        Tools:   ["Rhino 3D", "TouchDesigner", "QLab"],
        Mediums: ["Light", "Glass", "Resin", "Sound"],
      },
      projects: [
        { name: "Threshold Studies",    works: [{ title: "Liminal I", year: "2025" }, { title: "Liminal II", year: "2025" }, { title: "Passage Membrane", year: "2024" }] },
        { name: "Memory Architectures", works: [{ title: "Residue", year: "2024" }, { title: "Palimpsest", year: "2023" }, { title: "Soft Infrastructure", year: "2023" }] },
      ],
    },
  },
  { id: "mc", name: "Marcus Chen",     initials: "MC", title: "Interdisciplinary Artist",        email: "mc@example.com", location: "Vancouver, BC", color: "#2e3d52", stage: "development", risk: false, sections: 7, accepted: 6 },
  { id: "er", name: "Elena Rodriguez", initials: "ER", title: "Sculptor & Installation Artist",  email: "er@example.com", location: "Montreal, QC", color: "#4a3d5a", stage: "foundation",  risk: true,  sections: 7, accepted: 2 },
  { id: "jo", name: "James Okonkwo",   initials: "JO", title: "Performance & Media Artist",      email: "jo@example.com", location: "Toronto, ON",  color: "#52432e", stage: "showcase",    risk: false, sections: 7, accepted: 7 },
  { id: "mp", name: "Maya Patel",      initials: "MP", title: "Digital & Textile Artist",        email: "mp@example.com", location: "Calgary, AB",  color: "#2e4a3d", stage: "graduate",    risk: false, sections: 7, accepted: 7 },
  { id: "dk", name: "David Kim",       initials: "DK", title: "Photographer & Visual Artist",    email: "dk@example.com", location: "Ottawa, ON",   color: "#2e3a52", stage: "pending",     risk: false, sections: 7, accepted: 0 },
];

export const PROGRAM: Program = {
  name: "Creative Incubator",
  subtitle: "Spring Cohort 2025",
  week: 6,
  totalWeeks: 20,
  live: true,
};
