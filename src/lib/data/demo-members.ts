// Hardcoded demo member data for instant preview rendering
// This data is used in the demo flow and never fetched from Supabase

import type { Member, MemberProfile } from "@/types/member";
import type { Section } from "@/types/section";

export type DemoMember = {
  member: Member & { profile: MemberProfile };
  sections: Section[];
};

// Primary demo member shown in live preview
export const DEMO_MEMBER: DemoMember = {
  member: {
    id: "demo-ava",
    name: "Ava Martinez",
    initials: "AM",
    title: "Visual Artist & Spatial Designer",
    email: "ava@avamartinez.studio",
    phone: "+1 416 555 0192",
    location: "Toronto, ON",
    color: "#3b4f42",
    stage: "foundation",
    risk: false,
    sections: 7,
    accepted: 2,
    profile: {
      practice:
        "I build environments that hold a feeling. Each project begins with a question: what does this space want to remember? Light as primary material — shifting perceptual ground beneath a viewer's feet.",
      focus:
        "Currently developing a new body of work around bioluminescent systems and civic space.",
      goals: [
        "International exhibition presence",
        "Bioluminescent materials research",
        "Urban planner collaborations",
      ],
      influences: [
        "James Turrell",
        "Olafur Eliasson",
        "Ann Hamilton",
        "Rirkrit Tiravanija",
      ],
      availability: "open to residencies & commissions",
      skills: {
        Primary: ["Environmental Design", "Light Sculpture", "Spatial Narrative"],
        Tools: ["Rhino 3D", "TouchDesigner", "QLab"],
        Mediums: ["Light", "Glass", "Resin", "Sound"],
      },
      projects: [
        {
          name: "Threshold Studies",
          works: [
            { title: "Liminal I", year: "2025" },
            { title: "Liminal II", year: "2025" },
            { title: "Passage Membrane", year: "2024" },
          ],
        },
        {
          name: "Memory Architectures",
          works: [
            { title: "Residue", year: "2024" },
            { title: "Palimpsest", year: "2023" },
            { title: "Soft Infrastructure", year: "2023" },
          ],
        },
      ],
    },
  },
  sections: [
    {
      id: "practice",
      label: "Practice Statement",
      status: "accepted",
      evidence:
        "I build environments that hold a feeling. Each project begins with a question: what does this space want to remember?",
      cp: 1,
      feedback:
        "Strong opening. The light-as-material framing is distinctive.",
      feedbackAt: "Feb 28",
    },
    {
      id: "focus",
      label: "Current Focus",
      status: "submitted",
      evidence: "Bioluminescent systems + civic space",
      cp: 1,
    },
    {
      id: "material",
      label: "Material Sourcing Plan",
      status: "in_progress",
      evidence: "",
      cp: 1,
    },
    {
      id: "influences",
      label: "Influences & Context",
      status: "accepted",
      evidence: "Turrell, Eliasson, Hamilton",
      cp: 1,
      feedback: "Good range of influences.",
      feedbackAt: "Mar 1",
    },
    {
      id: "series",
      label: "Project Series",
      status: "in_progress",
      evidence: "",
      cp: 2,
    },
    {
      id: "exhibition",
      label: "Exhibition Goals",
      status: "empty",
      evidence: "",
      cp: 2,
    },
    {
      id: "collab",
      label: "Collaboration Outreach",
      status: "empty",
      evidence: "",
      cp: 2,
    },
  ],
};

// 6 demo members at different stages for preview step
export const DEMO_COHORT: DemoMember[] = [
  {
    member: {
      id: "demo-alex",
      name: "Alex Chen",
      initials: "AC",
      title: "Multimedia Artist",
      email: "alex@alexchen.art",
      location: "Vancouver, BC",
      color: "#2e4a52",
      stage: "pending",
      risk: false,
      sections: 7,
      accepted: 0,
      profile: {
        practice: "Exploring the intersection of technology and traditional crafts.",
        focus: "Interactive installations using recycled electronics.",
        goals: ["Gallery representation", "Tech partnerships"],
        influences: ["Nam June Paik", "Cory Arcangel"],
        availability: "open to commissions",
        skills: {
          Primary: ["Interactive Art", "Electronics"],
          Tools: ["Arduino", "Processing"],
          Mediums: ["E-waste", "LED", "Sound"],
        },
        projects: [],
      },
    },
    sections: [
      { id: "practice", label: "Practice Statement", status: "empty", evidence: "", cp: 1 },
      { id: "focus", label: "Current Focus", status: "empty", evidence: "", cp: 1 },
      { id: "material", label: "Material Sourcing Plan", status: "empty", evidence: "", cp: 1 },
      { id: "influences", label: "Influences & Context", status: "empty", evidence: "", cp: 1 },
      { id: "series", label: "Project Series", status: "empty", evidence: "", cp: 2 },
      { id: "exhibition", label: "Exhibition Goals", status: "empty", evidence: "", cp: 2 },
      { id: "collab", label: "Collaboration Outreach", status: "empty", evidence: "", cp: 2 },
    ],
  },
  {
    member: {
      id: "demo-maya",
      name: "Maya Rodriguez",
      initials: "MR",
      title: "Textile Designer",
      email: "maya@mayarodriguez.co",
      location: "Montreal, QC",
      color: "#4a3d52",
      stage: "entry",
      risk: false,
      sections: 7,
      accepted: 2,
      profile: {
        practice: "Weaving narratives through fiber and thread.",
        focus: "Sustainable textile practices.",
        goals: ["Fashion week debut", "Sustainability certification"],
        influences: ["Anni Albers", "Sheila Hicks"],
        availability: "selective projects",
        skills: {
          Primary: ["Weaving", "Pattern Design"],
          Tools: ["Jacquard Loom", "Adobe Illustrator"],
          Mediums: ["Natural Fibers", "Recycled Materials"],
        },
        projects: [],
      },
    },
    sections: [
      { id: "practice", label: "Practice Statement", status: "accepted", evidence: "Weaving narratives through fiber.", cp: 1 },
      { id: "focus", label: "Current Focus", status: "accepted", evidence: "Sustainable textiles", cp: 1 },
      { id: "material", label: "Material Sourcing Plan", status: "submitted", evidence: "", cp: 1 },
      { id: "influences", label: "Influences & Context", status: "in_progress", evidence: "", cp: 1 },
      { id: "series", label: "Project Series", status: "empty", evidence: "", cp: 2 },
      { id: "exhibition", label: "Exhibition Goals", status: "empty", evidence: "", cp: 2 },
      { id: "collab", label: "Collaboration Outreach", status: "empty", evidence: "", cp: 2 },
    ],
  },
  DEMO_MEMBER, // Ava at foundation
  {
    member: {
      id: "demo-jordan",
      name: "Jordan Kim",
      initials: "JK",
      title: "Ceramic Artist",
      email: "jordan@jordankim.studio",
      location: "Calgary, AB",
      color: "#52432e",
      stage: "development",
      risk: false,
      sections: 7,
      accepted: 5,
      profile: {
        practice: "Functional pottery with narrative elements.",
        focus: "Wood-fired techniques.",
        goals: ["Solo exhibition", "Teaching residency"],
        influences: ["Bernard Leach", "Lucie Rie"],
        availability: "open to commissions",
        skills: {
          Primary: ["Wheel Throwing", "Glazing"],
          Tools: ["Wood Kiln", "Gas Kiln"],
          Mediums: ["Stoneware", "Porcelain"],
        },
        projects: [],
      },
    },
    sections: [
      { id: "practice", label: "Practice Statement", status: "accepted", evidence: "Functional pottery.", cp: 1 },
      { id: "focus", label: "Current Focus", status: "accepted", evidence: "Wood-fired techniques", cp: 1 },
      { id: "material", label: "Material Sourcing Plan", status: "accepted", evidence: "Local clay sources", cp: 1 },
      { id: "influences", label: "Influences & Context", status: "accepted", evidence: "Leach, Rie", cp: 1 },
      { id: "series", label: "Project Series", status: "accepted", evidence: "Tea ceremony vessels", cp: 2 },
      { id: "exhibition", label: "Exhibition Goals", status: "submitted", evidence: "", cp: 2 },
      { id: "collab", label: "Collaboration Outreach", status: "in_progress", evidence: "", cp: 2 },
    ],
  },
  {
    member: {
      id: "demo-sam",
      name: "Sam Patel",
      initials: "SP",
      title: "Sound Artist",
      email: "sam@sampatel.audio",
      location: "Toronto, ON",
      color: "#2e3d52",
      stage: "showcase",
      risk: false,
      sections: 7,
      accepted: 7,
      profile: {
        practice: "Creating immersive soundscapes from urban field recordings.",
        focus: "Spatial audio for public installations.",
        goals: ["Festival headliner", "Museum commission"],
        influences: ["Brian Eno", "Pauline Oliveros"],
        availability: "limited availability",
        skills: {
          Primary: ["Field Recording", "Composition"],
          Tools: ["Ableton", "Max/MSP", "Ambisonic Mics"],
          Mediums: ["Sound", "Vibration", "Space"],
        },
        projects: [],
      },
    },
    sections: [
      { id: "practice", label: "Practice Statement", status: "accepted", evidence: "Immersive soundscapes.", cp: 1 },
      { id: "focus", label: "Current Focus", status: "accepted", evidence: "Spatial audio", cp: 1 },
      { id: "material", label: "Material Sourcing Plan", status: "accepted", evidence: "Urban recordings", cp: 1 },
      { id: "influences", label: "Influences & Context", status: "accepted", evidence: "Eno, Oliveros", cp: 1 },
      { id: "series", label: "Project Series", status: "accepted", evidence: "City Resonance", cp: 2 },
      { id: "exhibition", label: "Exhibition Goals", status: "accepted", evidence: "Nuit Blanche", cp: 2 },
      { id: "collab", label: "Collaboration Outreach", status: "accepted", evidence: "Architect partnerships", cp: 2 },
    ],
  },
  {
    member: {
      id: "demo-riley",
      name: "Riley Thompson",
      initials: "RT",
      title: "Photographer",
      email: "riley@rileythompson.photo",
      location: "Ottawa, ON",
      color: "#3d4a2e",
      stage: "graduate",
      risk: false,
      sections: 7,
      accepted: 7,
      profile: {
        practice: "Documentary photography exploring urban transformation.",
        focus: "Long-form visual essays.",
        goals: ["Book publication", "Major award"],
        influences: ["Robert Frank", "Vivian Maier"],
        availability: "editorial only",
        skills: {
          Primary: ["Documentary", "Street Photography"],
          Tools: ["Leica M", "Medium Format"],
          Mediums: ["Film", "Digital"],
        },
        projects: [],
      },
    },
    sections: [
      { id: "practice", label: "Practice Statement", status: "accepted", evidence: "Documentary photography.", cp: 1 },
      { id: "focus", label: "Current Focus", status: "accepted", evidence: "Visual essays", cp: 1 },
      { id: "material", label: "Material Sourcing Plan", status: "accepted", evidence: "Archival prints", cp: 1 },
      { id: "influences", label: "Influences & Context", status: "accepted", evidence: "Frank, Maier", cp: 1 },
      { id: "series", label: "Project Series", status: "accepted", evidence: "Changing Cities", cp: 2 },
      { id: "exhibition", label: "Exhibition Goals", status: "accepted", evidence: "AGO exhibition", cp: 2 },
      { id: "collab", label: "Collaboration Outreach", status: "accepted", evidence: "Publisher secured", cp: 2 },
    ],
  },
];
