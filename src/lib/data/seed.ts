// Stub data matching prototype constants exactly.
// Replace each function body with a Supabase query when the DB is ready.

import type { Section } from "@/types/section";
import type { Room } from "@/types/room";
import type { Member } from "@/types/member";
import type { Program } from "@/types/program";

// Legacy sections (for backwards compatibility)
export const INIT: Section[] = [
  { id: "practice",   label: "Practice Statement",    status: "in_progress", evidence: "I build environments that hold a feeling...", cp: 1 },
  { id: "focus",      label: "Current Focus",          status: "in_progress", evidence: "Bioluminescent systems + civic space",        cp: 1 },
  { id: "material",   label: "Material Sourcing Plan", status: "empty",       evidence: "",                                            cp: 1 },
  { id: "influences", label: "Influences & Context",   status: "in_progress", evidence: "Turrell, Eliasson, Hamilton",                  cp: 1 },
  { id: "series",     label: "Project Series",          status: "empty",       evidence: "",                                            cp: 2 },
  { id: "exhibition", label: "Exhibition Goals",        status: "empty",       evidence: "",                                            cp: 2 },
  { id: "collab",     label: "Collaboration Outreach",  status: "empty",       evidence: "",                                            cp: 2 },
];

// New rooms structure
export const INIT_ROOMS: Room[] = [
  {
    id: "room_practice",
    key: "practice",
    label: "Your practice",
    roomType: "text",
    stageMarker: "early",
    prompt: "What is your practice and why do you make it?",
    status: "in_progress",
    orderIndex: 0,
    isPublic: true,
    content: {
      type: "text",
      data: {
        body: "I build environments that hold a feeling. Each project begins with a question: what does this space want to remember? Light as primary material — shifting perceptual ground beneath a viewer's feet.",
      },
    },
  },
  {
    id: "room_focus",
    key: "focus",
    label: "What you're working on",
    roomType: "text",
    stageMarker: "early",
    prompt: "The specific project or question you're exploring right now",
    status: "in_progress",
    orderIndex: 1,
    isPublic: true,
    content: {
      type: "text",
      data: {
        body: "Currently developing a new body of work around bioluminescent systems and civic space.",
      },
    },
  },
  {
    id: "room_material",
    key: "material",
    label: "Your materials",
    roomType: "text",
    stageMarker: "early",
    prompt: "What you work with and where you get it",
    status: "empty",
    orderIndex: 2,
    isPublic: true,
    content: {
      type: "text",
      data: { body: "" },
    },
  },
  {
    id: "room_influences",
    key: "influences",
    label: "Who shaped you",
    roomType: "text",
    stageMarker: "early",
    prompt: "Artists, thinkers, or movements that inform your work",
    status: "in_progress",
    orderIndex: 3,
    isPublic: true,
    content: {
      type: "text",
      data: {
        body: "James Turrell, Olafur Eliasson, Ann Hamilton, Rirkrit Tiravanija",
      },
    },
  },
  {
    id: "room_reference",
    key: "reference_board",
    label: "Reference board",
    roomType: "moodboard",
    stageMarker: "ongoing",
    prompt: "Images, links, and references that inform your work",
    status: "ongoing",
    orderIndex: 4,
    isPublic: false,
    content: {
      type: "moodboard",
      data: {
        items: [
          {
            id: "media_1",
            mediaType: "link",
            url: "https://www.are.na/block/12345",
            ogTitle: "Light & Space Movement",
            ogDescription: "Reference collection",
            orderIndex: 0,
          },
        ],
      },
    },
  },
  {
    id: "room_series",
    key: "series",
    label: "Your body of work",
    roomType: "text",
    stageMarker: "later",
    prompt: "The projects that belong together under this program",
    status: "in_progress",
    orderIndex: 5,
    isPublic: true,
    content: {
      type: "text",
      data: { body: "" },
    },
  },
  {
    id: "room_gallery",
    key: "works_gallery",
    label: "Your work",
    roomType: "gallery",
    stageMarker: "later",
    prompt: "Documentation of finished pieces",
    status: "empty",
    orderIndex: 6,
    isPublic: true,
    content: {
      type: "gallery",
      data: { items: [] },
    },
  },
  {
    id: "room_works",
    key: "works_list",
    label: "Works list",
    roomType: "works",
    stageMarker: "later",
    prompt: "Titled projects with year and medium",
    status: "empty",
    orderIndex: 7,
    isPublic: true,
    content: {
      type: "works",
      data: {
        items: [
          { id: "work_1", title: "Liminal I", year: "2025", medium: "Light installation", orderIndex: 0 },
          { id: "work_2", title: "Liminal II", year: "2025", medium: "Light installation", orderIndex: 1 },
          { id: "work_3", title: "Passage Membrane", year: "2024", medium: "Glass, resin, light", orderIndex: 2 },
        ],
      },
    },
  },
  {
    id: "room_showreel",
    key: "showreel",
    label: "Showreel",
    roomType: "embed",
    stageMarker: "ongoing",
    prompt: "Link your primary video, audio, or interactive work",
    status: "ongoing",
    orderIndex: 8,
    isPublic: true,
  },
  {
    id: "room_exhibition",
    key: "exhibition",
    label: "Where you want to show",
    roomType: "text",
    stageMarker: "later",
    prompt: "The venues, contexts, or audiences you're working toward",
    status: "empty",
    orderIndex: 9,
    isPublic: true,
    content: {
      type: "text",
      data: { body: "" },
    },
  },
  {
    id: "room_collab",
    key: "collab",
    label: "Who you want to work with",
    roomType: "text",
    stageMarker: "later",
    prompt: "Collaborators, institutions, or communities you're reaching out to",
    status: "empty",
    orderIndex: 10,
    isPublic: true,
    content: {
      type: "text",
      data: { body: "" },
    },
  },
];

export const MEMBERS: Member[] = [
  {
    id: "am", name: "Ava Martinez",     initials: "AM", title: "Visual Artist & Spatial Designer",
    email: "ava@avamartinez.studio",    phone: "+1 416 555 0192",
    location: "Toronto, ON",            color: "#3b4f42",
    stage: "foundation", risk: false, sections: 7, accepted: 0,
    profile: {
      practice:     "I build environments that hold a feeling. Each project begins with a question: what does this space want to remember? Light as primary material \u2014 shifting perceptual ground beneath a viewer's feet.",
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
