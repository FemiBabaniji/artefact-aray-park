// Community dashboard data layer
// Uses stub data for now - replace with Supabase queries when ready

import type {
  CommunityConfig,
  DashboardMember,
  ActivityItem,
  Alert,
  DashboardStats,
  CohortProgressMap,
  RoomProgressItem,
  MemberStatus,
} from "@/types/community";
import type { RoomStatus } from "@/types/room";
import type { Identity, StandaloneRoom } from "@/types/artefact";
import type {
  MetricBlockContent,
  MilestoneBlockContent,
  ProjectBlockContent,
  SkillBlockContent,
  ExperienceBlockContent,
  EducationBlockContent,
  RelationshipBlockContent,
} from "@/types/structured-blocks";

// ── Stub Data ────────────────────────────────────────────────────────────────

const STUB_COMMUNITY: CommunityConfig = {
  id: "bfn-winter-2025",
  name: "Black Founders Network",
  cohort: "Winter 2025",
  theme: "dark",
  memberCount: 42,
  rooms: [
    { id: "identity", key: "identity", label: "Identity", type: "about", shared: false, visibility: "public" },
    { id: "startup", key: "startup", label: "Startup", type: "about", shared: false, visibility: "public" },
    { id: "pitch", key: "pitch", label: "Pitch", type: "projects", shared: false, visibility: "public" },
    { id: "traction", key: "traction", label: "Traction", type: "metrics", shared: false, visibility: "public" },
    { id: "documents", key: "documents", label: "Documents", type: "custom", shared: false, visibility: "private" },
  ],
  createdAt: "2025-01-15T00:00:00Z",
  ownerId: "owner-1",
};

const makeRoomProgress = (statuses: Record<string, { status: RoomStatus; pct: number }>): RoomProgressItem[] => {
  return STUB_COMMUNITY.rooms.map(r => ({
    roomKey: r.key,
    roomLabel: r.label,
    status: statuses[r.key]?.status || "empty",
    completionPercent: statuses[r.key]?.pct || 0,
  }));
};

const STUB_MEMBERS: DashboardMember[] = [
  {
    id: "km",
    name: "Kwame Mensah",
    initials: "KM",
    title: "Founder & CEO",
    email: "kwame@pathwai.com",
    location: "Atlanta, GA",
    color: "#4f6d7a",
    stage: "development",
    risk: false,
    sections: 5,
    accepted: 4,
    company: "PathWAI",
    artefactId: "kwame-pathwai",
    lastActivity: "2026-03-10T10:00:00Z", // 2 hours ago
    activityCount: 5,
    roomProgress: makeRoomProgress({
      identity: { status: "accepted", pct: 100 },
      startup: { status: "accepted", pct: 100 },
      pitch: { status: "in_progress", pct: 60 },
      traction: { status: "accepted", pct: 100 },
      documents: { status: "accepted", pct: 100 },
    }),
  },
  {
    id: "tg",
    name: "Tiana Grant",
    initials: "TG",
    title: "CEO",
    email: "tiana@finbridge.io",
    location: "Chicago, IL",
    color: "#7a4f6d",
    stage: "foundation",
    risk: true,
    sections: 5,
    accepted: 2,
    company: "FinBridge",
    artefactId: "tiana-finbridge",
    lastActivity: "2026-03-09T12:00:00Z", // yesterday
    activityCount: 2,
    roomProgress: makeRoomProgress({
      identity: { status: "accepted", pct: 100 },
      startup: { status: "accepted", pct: 100 },
      pitch: { status: "empty", pct: 0 },
      traction: { status: "in_progress", pct: 30 },
      documents: { status: "empty", pct: 0 },
    }),
  },
  {
    id: "ml",
    name: "Marcus Lewis",
    initials: "ML",
    title: "Founder",
    email: "marcus@agrios.tech",
    location: "Houston, TX",
    color: "#6d7a4f",
    stage: "showcase",
    risk: false,
    sections: 5,
    accepted: 5,
    company: "AgriOS",
    artefactId: "marcus-agrios",
    lastActivity: "2026-03-10T11:30:00Z", // today
    activityCount: 3,
    roomProgress: makeRoomProgress({
      identity: { status: "accepted", pct: 100 },
      startup: { status: "accepted", pct: 100 },
      pitch: { status: "accepted", pct: 100 },
      traction: { status: "accepted", pct: 100 },
      documents: { status: "in_progress", pct: 80 },
    }),
  },
  {
    id: "fa",
    name: "Fatima Ahmed",
    initials: "FA",
    title: "Co-founder",
    email: "fatima@solarloop.co",
    location: "Oakland, CA",
    color: "#4f7a6d",
    stage: "development",
    risk: false,
    sections: 5,
    accepted: 4,
    company: "SolarLoop",
    artefactId: "fatima-solarloop",
    lastActivity: "2026-03-10T09:00:00Z", // 3 hours ago
    activityCount: 4,
    roomProgress: makeRoomProgress({
      identity: { status: "accepted", pct: 100 },
      startup: { status: "accepted", pct: 100 },
      pitch: { status: "in_progress", pct: 75 },
      traction: { status: "accepted", pct: 100 },
      documents: { status: "accepted", pct: 100 },
    }),
  },
  {
    id: "jt",
    name: "Jordan Taylor",
    initials: "JT",
    title: "Founder",
    email: "jordan@healthstack.io",
    location: "Brooklyn, NY",
    color: "#6d4f7a",
    stage: "entry",
    risk: true,
    sections: 5,
    accepted: 1,
    company: "HealthStack",
    artefactId: "jordan-healthstack",
    lastActivity: "2026-02-23T12:00:00Z", // 15 days ago
    activityCount: 0,
    roomProgress: makeRoomProgress({
      identity: { status: "in_progress", pct: 50 },
      startup: { status: "empty", pct: 0 },
      pitch: { status: "empty", pct: 0 },
      traction: { status: "empty", pct: 0 },
      documents: { status: "empty", pct: 0 },
    }),
  },
  {
    id: "db",
    name: "Devon Brown",
    initials: "DB",
    title: "CEO",
    email: "devon@logisync.com",
    location: "Dallas, TX",
    color: "#7a6d4f",
    stage: "foundation",
    risk: false,
    sections: 5,
    accepted: 3,
    company: "LogiSync",
    artefactId: "devon-logisync",
    lastActivity: "2026-03-10T07:00:00Z", // 5 hours ago
    activityCount: 2,
    roomProgress: makeRoomProgress({
      identity: { status: "accepted", pct: 100 },
      startup: { status: "accepted", pct: 100 },
      pitch: { status: "in_progress", pct: 40 },
      traction: { status: "accepted", pct: 100 },
      documents: { status: "empty", pct: 0 },
    }),
  },
];

const STUB_ACTIVITY: ActivityItem[] = [
  { id: "a1", memberId: "km", memberName: "Kwame Mensah", action: "added", target: "traction metrics", targetType: "block", timestamp: "2026-03-10T10:00:00Z" },
  { id: "a2", memberId: "tg", memberName: "Tiana Grant", action: "uploaded", target: "pitch deck", targetType: "document", timestamp: "2026-03-10T07:00:00Z" },
  { id: "a3", memberId: "ml", memberName: "Marcus Lewis", action: "updated", target: "startup description", targetType: "room", timestamp: "2026-03-10T06:00:00Z" },
  { id: "a4", memberId: "fa", memberName: "Fatima Ahmed", action: "added", target: "investor intro", targetType: "block", timestamp: "2026-03-10T04:00:00Z" },
  { id: "a5", memberId: "db", memberName: "Devon Brown", action: "completed", target: "Identity room", targetType: "room", timestamp: "2026-03-10T02:00:00Z" },
  { id: "a6", memberId: "km", memberName: "Kwame Mensah", action: "submitted", target: "Pitch room", targetType: "room", timestamp: "2026-03-09T12:00:00Z" },
  { id: "a7", memberId: "fa", memberName: "Fatima Ahmed", action: "updated", target: "team section", targetType: "block", timestamp: "2026-03-09T10:00:00Z" },
  { id: "a8", memberId: "ml", memberName: "Marcus Lewis", action: "added", target: "revenue metrics", targetType: "block", timestamp: "2026-03-08T12:00:00Z" },
];

const STUB_ALERTS: Alert[] = [
  { id: "alert1", type: "inactive", memberId: "jt", memberName: "Jordan Taylor", message: "Inactive for 15 days", severity: "critical", daysInactive: 15 },
  { id: "alert2", type: "missing_room", memberId: "tg", memberName: "Tiana Grant", message: "Missing Pitch room", severity: "warning", roomKey: "pitch" },
  { id: "alert3", type: "missing_room", memberId: "jt", memberName: "Jordan Taylor", message: "Missing Startup room", severity: "warning", roomKey: "startup" },
  { id: "alert4", type: "incomplete_profile", memberId: "db", memberName: "Devon Brown", message: "Incomplete startup profile", severity: "warning" },
];

// ── Rich Mock Artefact Data ──────────────────────────────────────────────────

export type MockMemberArtefact = {
  memberId: string;
  identity: Identity;
  rooms: StandaloneRoom[];
};

export const MOCK_MEMBER_ARTEFACTS: Record<string, MockMemberArtefact> = {
  // ── Kwame Mensah / PathWAI (90% complete, development stage) ──
  km: {
    memberId: "km",
    identity: {
      name: "Kwame Mensah",
      title: "Founder & CEO at PathWAI",
      bio: "Building AI-powered career guidance for first-generation professionals. Former ML engineer at Google. Stanford CS grad. Passionate about democratizing access to mentorship.",
      location: "Atlanta, GA",
      skills: ["AI/ML", "Product Strategy", "EdTech", "Fundraising", "Team Building"],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/kwamemensah" },
        { label: "Twitter", url: "https://twitter.com/kwamepathwai" },
      ],
      email: "kwame@pathwai.com",
    },
    rooms: [
      {
        id: "identity",
        key: "identity",
        label: "Identity",
        visibility: "public",
        orderIndex: 0,
        blocks: [
          { id: "km-i1", blockType: "text", content: "First-generation college grad turned founder. I spent 4 years at Google building ML systems before realizing the career guidance gap for people like me.", orderIndex: 0 },
          { id: "km-i2", blockType: "skill", content: "", orderIndex: 1, metadata: { name: "Machine Learning", level: "expert", years: 6, category: "Technical" } as SkillBlockContent },
          { id: "km-i3", blockType: "skill", content: "", orderIndex: 2, metadata: { name: "Product Management", level: "advanced", years: 3, category: "Leadership" } as SkillBlockContent },
          { id: "km-i4", blockType: "experience", content: "", orderIndex: 3, metadata: { title: "ML Engineer", organization: "Google", location: "Mountain View, CA", startDate: "2020-06", endDate: "2024-01", description: "Built recommendation systems for YouTube Learning", highlights: ["Led team of 4 engineers", "Shipped features to 100M+ users"], skills: ["TensorFlow", "Python", "GCP"] } as ExperienceBlockContent },
          { id: "km-i5", blockType: "education", content: "", orderIndex: 4, metadata: { institution: "Stanford University", degree: "B.S.", field: "Computer Science", startDate: "2016", endDate: "2020", highlights: ["AI concentration", "Dean's List"] } as EducationBlockContent },
        ],
      },
      {
        id: "startup",
        key: "startup",
        label: "Startup",
        visibility: "public",
        orderIndex: 1,
        blocks: [
          { id: "km-s1", blockType: "project", content: "", orderIndex: 0, metadata: { title: "PathWAI", description: "AI-powered career coach that provides personalized guidance to first-generation professionals. We match users with mentors, surface relevant opportunities, and provide interview prep.", status: "in_progress", skills: ["AI/ML", "EdTech", "B2B SaaS"], highlights: ["2,400+ active users", "B2B pilot with 3 universities", "$1.2M seed raised"], metrics: [{ label: "Users", value: "2,400" }, { label: "NPS", value: "72" }] } as ProjectBlockContent },
          { id: "km-s2", blockType: "text", content: "We're building the career guidance system I wish I had. Our AI understands context—it knows that a first-gen student from Atlanta has different needs than someone with family connections in tech.", orderIndex: 1 },
          { id: "km-s3", blockType: "relationship", content: "", orderIndex: 2, metadata: { personName: "Marcus Thompson", personTitle: "Partner", personOrg: "Techstars Atlanta", relationship: "Lead Investor", context: "Led our seed round, provides weekly office hours" } as RelationshipBlockContent },
        ],
      },
      {
        id: "pitch",
        key: "pitch",
        label: "Pitch",
        visibility: "public",
        orderIndex: 2,
        blocks: [
          { id: "km-p1", blockType: "text", content: "**The Problem**: 70% of first-generation professionals leave their first job within 18 months due to lack of guidance and mentorship.\n\n**Our Solution**: PathWAI uses AI to deliver personalized career coaching at scale—matching users with relevant mentors, surfacing opportunities, and providing real-time interview prep.", orderIndex: 0 },
          { id: "km-p2", blockType: "link", content: "", orderIndex: 1, metadata: { url: "https://pathwai.com/demo", title: "PathWAI Product Demo", description: "See how our AI career coach works" } },
        ],
      },
      {
        id: "traction",
        key: "traction",
        label: "Traction",
        visibility: "public",
        orderIndex: 3,
        blocks: [
          { id: "km-t1", blockType: "metric", content: "", orderIndex: 0, metadata: { value: 12400, label: "MRR", unit: "USD", change: 23, period: "month", format: "currency" } as MetricBlockContent },
          { id: "km-t2", blockType: "metric", content: "", orderIndex: 1, metadata: { value: 2400, label: "Active Users", change: 18, period: "month", format: "number" } as MetricBlockContent },
          { id: "km-t3", blockType: "metric", content: "", orderIndex: 2, metadata: { value: 72, label: "NPS Score", format: "number" } as MetricBlockContent },
          { id: "km-t4", blockType: "metric", content: "", orderIndex: 3, metadata: { value: 23, label: "MoM Growth", unit: "%", format: "percent" } as MetricBlockContent },
          { id: "km-t5", blockType: "milestone", content: "", orderIndex: 4, metadata: { title: "Seed Round Closed", date: "2025-11-15", description: "Raised $1.2M from Techstars Atlanta and angel investors", type: "achievement" } as MilestoneBlockContent },
          { id: "km-t6", blockType: "milestone", content: "", orderIndex: 5, metadata: { title: "University Pilots Launched", date: "2025-09-01", description: "Signed B2B deals with Georgia Tech, Morehouse, and Spelman", type: "achievement" } as MilestoneBlockContent },
          { id: "km-t7", blockType: "milestone", content: "", orderIndex: 6, metadata: { title: "Beta Launch", date: "2025-06-15", description: "Launched to first 500 users", type: "release" } as MilestoneBlockContent },
        ],
      },
      {
        id: "documents",
        key: "documents",
        label: "Documents",
        visibility: "private",
        orderIndex: 4,
        blocks: [
          { id: "km-d1", blockType: "text", content: "Pitch deck and one-pager available upon request.", orderIndex: 0 },
        ],
      },
    ],
  },

  // ── Tiana Grant / FinBridge (40% complete, at risk) ──
  tg: {
    memberId: "tg",
    identity: {
      name: "Tiana Grant",
      title: "CEO at FinBridge",
      bio: "Making financial literacy accessible to underbanked communities. Former Goldman Sachs analyst.",
      location: "Chicago, IL",
      skills: ["Finance", "Community Building", "Product"],
      links: [{ label: "LinkedIn", url: "https://linkedin.com/in/tianagrant" }],
      email: "tiana@finbridge.io",
    },
    rooms: [
      {
        id: "identity",
        key: "identity",
        label: "Identity",
        visibility: "public",
        orderIndex: 0,
        blocks: [
          { id: "tg-i1", blockType: "text", content: "Chicago native passionate about closing the wealth gap. Spent 5 years on Wall Street before pivoting to build for my community.", orderIndex: 0 },
          { id: "tg-i2", blockType: "experience", content: "", orderIndex: 1, metadata: { title: "Investment Banking Analyst", organization: "Goldman Sachs", location: "New York, NY", startDate: "2019-07", endDate: "2024-03", description: "Structured finance and community development", highlights: ["$2B in deals closed"], skills: ["Financial Modeling", "Due Diligence"] } as ExperienceBlockContent },
        ],
      },
      {
        id: "startup",
        key: "startup",
        label: "Startup",
        visibility: "public",
        orderIndex: 1,
        blocks: [
          { id: "tg-s1", blockType: "project", content: "", orderIndex: 0, metadata: { title: "FinBridge", description: "Mobile-first financial education platform for underbanked communities. Gamified learning with real-world rewards.", status: "in_progress", skills: ["FinTech", "EdTech", "Mobile"], highlights: ["850 beta users", "Partnership with 2 credit unions"] } as ProjectBlockContent },
        ],
      },
      {
        id: "pitch",
        key: "pitch",
        label: "Pitch",
        visibility: "public",
        orderIndex: 2,
        blocks: [], // Empty - needs attention
      },
      {
        id: "traction",
        key: "traction",
        label: "Traction",
        visibility: "public",
        orderIndex: 3,
        blocks: [
          { id: "tg-t1", blockType: "metric", content: "", orderIndex: 0, metadata: { value: 850, label: "Beta Users", change: 15, period: "month", format: "number" } as MetricBlockContent },
          { id: "tg-t2", blockType: "metric", content: "", orderIndex: 1, metadata: { value: 2, label: "Credit Union Partners", format: "number" } as MetricBlockContent },
        ],
      },
      {
        id: "documents",
        key: "documents",
        label: "Documents",
        visibility: "private",
        orderIndex: 4,
        blocks: [], // Empty
      },
    ],
  },

  // ── Marcus Lewis / AgriOS (100% complete, showcase stage) ──
  ml: {
    memberId: "ml",
    identity: {
      name: "Marcus Lewis",
      title: "Founder at AgriOS",
      bio: "Third-generation farmer turned tech founder. Building the operating system for small-scale sustainable agriculture. MIT Sloan MBA. USDA Innovation Fellow.",
      location: "Houston, TX",
      skills: ["AgTech", "IoT", "Operations", "Sustainability", "Hardware", "Fundraising"],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/marcuslewisagri" },
        { label: "Website", url: "https://agrios.tech" },
      ],
      email: "marcus@agrios.tech",
    },
    rooms: [
      {
        id: "identity",
        key: "identity",
        label: "Identity",
        visibility: "public",
        orderIndex: 0,
        blocks: [
          { id: "ml-i1", blockType: "text", content: "I grew up on my grandparents' farm in East Texas. After MIT, I returned to agriculture with a mission: help small farms compete with industrial operations through smart technology.", orderIndex: 0 },
          { id: "ml-i2", blockType: "skill", content: "", orderIndex: 1, metadata: { name: "Agricultural Systems", level: "expert", years: 15, category: "Domain" } as SkillBlockContent },
          { id: "ml-i3", blockType: "skill", content: "", orderIndex: 2, metadata: { name: "IoT Engineering", level: "advanced", years: 5, category: "Technical" } as SkillBlockContent },
          { id: "ml-i4", blockType: "skill", content: "", orderIndex: 3, metadata: { name: "Supply Chain", level: "advanced", years: 8, category: "Operations" } as SkillBlockContent },
          { id: "ml-i5", blockType: "education", content: "", orderIndex: 4, metadata: { institution: "MIT Sloan School of Management", degree: "MBA", field: "Entrepreneurship", startDate: "2018", endDate: "2020", highlights: ["MIT $100K Finalist", "Sustainability Track"] } as EducationBlockContent },
          { id: "ml-i6", blockType: "education", content: "", orderIndex: 5, metadata: { institution: "Texas A&M University", degree: "B.S.", field: "Agricultural Engineering", startDate: "2010", endDate: "2014" } as EducationBlockContent },
        ],
      },
      {
        id: "startup",
        key: "startup",
        label: "Startup",
        visibility: "public",
        orderIndex: 1,
        blocks: [
          { id: "ml-s1", blockType: "project", content: "", orderIndex: 0, metadata: { title: "AgriOS", description: "Complete farm management platform combining IoT sensors, AI-powered crop recommendations, and direct-to-market sales channels. We help small farms increase yields by 40% while reducing water usage.", status: "in_progress", skills: ["IoT", "AI/ML", "AgTech", "Hardware"], highlights: ["340 farms on platform", "Series A raised", "$2.1M ARR"], metrics: [{ label: "Farms", value: "340" }, { label: "ARR", value: "$2.1M" }] } as ProjectBlockContent },
          { id: "ml-s2", blockType: "text", content: "Our hardware + software solution provides real-time soil monitoring, automated irrigation, and predictive analytics—all accessible via mobile app.", orderIndex: 1 },
          { id: "ml-s3", blockType: "relationship", content: "", orderIndex: 2, metadata: { personName: "Dr. Elena Vasquez", personTitle: "Partner", personOrg: "Congruent Ventures", relationship: "Board Member & Lead Investor", context: "Led Series A, deep expertise in climate tech" } as RelationshipBlockContent },
          { id: "ml-s4", blockType: "relationship", content: "", orderIndex: 3, metadata: { personName: "James Chen", personTitle: "VP Engineering", personOrg: "John Deere (Former)", relationship: "Advisor", context: "Advises on hardware and enterprise sales strategy" } as RelationshipBlockContent },
        ],
      },
      {
        id: "pitch",
        key: "pitch",
        label: "Pitch",
        visibility: "public",
        orderIndex: 2,
        blocks: [
          { id: "ml-p1", blockType: "text", content: "**The Problem**: Small farms (under 500 acres) represent 90% of US farms but lack access to precision agriculture technology that costs $50K+ to implement.\n\n**Our Solution**: AgriOS delivers enterprise-grade farm intelligence at $199/month—affordable for family farms.\n\n**Traction**: 340 farms, $2.1M ARR, 40% average yield improvement.", orderIndex: 0 },
          { id: "ml-p2", blockType: "link", content: "", orderIndex: 1, metadata: { url: "https://agrios.tech/case-studies", title: "AgriOS Case Studies", description: "See how farms are transforming with AgriOS" } },
          { id: "ml-p3", blockType: "milestone", content: "", orderIndex: 2, metadata: { title: "Featured in Forbes 30 Under 30", date: "2025-12-01", description: "Agriculture category", type: "award" } as MilestoneBlockContent },
        ],
      },
      {
        id: "traction",
        key: "traction",
        label: "Traction",
        visibility: "public",
        orderIndex: 3,
        blocks: [
          { id: "ml-t1", blockType: "metric", content: "", orderIndex: 0, metadata: { value: 2100000, label: "ARR", unit: "USD", change: 140, period: "year", format: "currency" } as MetricBlockContent },
          { id: "ml-t2", blockType: "metric", content: "", orderIndex: 1, metadata: { value: 340, label: "Farms on Platform", change: 25, period: "quarter", format: "number" } as MetricBlockContent },
          { id: "ml-t3", blockType: "metric", content: "", orderIndex: 2, metadata: { value: 40, label: "Avg Yield Improvement", unit: "%", format: "percent" } as MetricBlockContent },
          { id: "ml-t4", blockType: "metric", content: "", orderIndex: 3, metadata: { value: 35, label: "Water Reduction", unit: "%", format: "percent" } as MetricBlockContent },
          { id: "ml-t5", blockType: "metric", content: "", orderIndex: 4, metadata: { value: 94, label: "Customer Retention", unit: "%", format: "percent" } as MetricBlockContent },
          { id: "ml-t6", blockType: "metric", content: "", orderIndex: 5, metadata: { value: 8500000, label: "Series A Raised", unit: "USD", format: "currency" } as MetricBlockContent },
          { id: "ml-t7", blockType: "milestone", content: "", orderIndex: 6, metadata: { title: "Series A Closed", date: "2025-10-01", description: "$8.5M led by Congruent Ventures", type: "achievement" } as MilestoneBlockContent },
          { id: "ml-t8", blockType: "milestone", content: "", orderIndex: 7, metadata: { title: "USDA Innovation Grant", date: "2025-03-15", description: "$500K non-dilutive grant", type: "achievement" } as MilestoneBlockContent },
          { id: "ml-t9", blockType: "milestone", content: "", orderIndex: 8, metadata: { title: "100th Farm Onboarded", date: "2024-11-01", description: "Milestone customer acquisition", type: "achievement" } as MilestoneBlockContent },
        ],
      },
      {
        id: "documents",
        key: "documents",
        label: "Documents",
        visibility: "private",
        orderIndex: 4,
        blocks: [
          { id: "ml-d1", blockType: "text", content: "Full data room available for qualified investors. Includes pitch deck, financial model, customer contracts, and technical architecture.", orderIndex: 0 },
        ],
      },
    ],
  },

  // ── Fatima Ahmed / SolarLoop (75% complete, development stage) ──
  fa: {
    memberId: "fa",
    identity: {
      name: "Fatima Ahmed",
      title: "Co-founder at SolarLoop",
      bio: "Engineer turned climate tech founder. Building circular economy solutions for solar panel recycling. Previously led sustainability at Tesla Energy.",
      location: "Oakland, CA",
      skills: ["CleanTech", "Hardware", "Supply Chain", "Sustainability", "Operations"],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/fatima-ahmed-solar" },
        { label: "Twitter", url: "https://twitter.com/fatimasolarloop" },
      ],
      email: "fatima@solarloop.co",
    },
    rooms: [
      {
        id: "identity",
        key: "identity",
        label: "Identity",
        visibility: "public",
        orderIndex: 0,
        blocks: [
          { id: "fa-i1", blockType: "text", content: "I spent 6 years at Tesla working on energy storage before realizing we had a massive blind spot: end-of-life solar panels. By 2030, we'll have 1M tons of solar waste annually. SolarLoop is building the infrastructure to turn that waste into value.", orderIndex: 0 },
          { id: "fa-i2", blockType: "experience", content: "", orderIndex: 1, metadata: { title: "Senior Manager, Sustainability", organization: "Tesla Energy", location: "Fremont, CA", startDate: "2018-03", endDate: "2024-06", current: false, description: "Led circular economy initiatives for Powerwall and Solar Roof programs", highlights: ["Reduced manufacturing waste by 30%", "Built recycling partnerships"], skills: ["Sustainability", "Operations", "Supply Chain"] } as ExperienceBlockContent },
          { id: "fa-i3", blockType: "skill", content: "", orderIndex: 2, metadata: { name: "Solar Technology", level: "expert", years: 8, category: "Technical" } as SkillBlockContent },
          { id: "fa-i4", blockType: "skill", content: "", orderIndex: 3, metadata: { name: "Circular Economy", level: "expert", years: 6, category: "Domain" } as SkillBlockContent },
        ],
      },
      {
        id: "startup",
        key: "startup",
        label: "Startup",
        visibility: "public",
        orderIndex: 1,
        blocks: [
          { id: "fa-s1", blockType: "project", content: "", orderIndex: 0, metadata: { title: "SolarLoop", description: "End-to-end solar panel recycling and materials recovery. We extract 95% of valuable materials (silver, silicon, copper) and resell to manufacturers—creating a true circular economy for solar.", status: "in_progress", skills: ["CleanTech", "Hardware", "Recycling"], highlights: ["Pilot facility operational", "LOIs from 3 major installers", "DOE grant recipient"], metrics: [{ label: "Recovery Rate", value: "95%" }, { label: "Panels Processed", value: "12K" }] } as ProjectBlockContent },
          { id: "fa-s2", blockType: "relationship", content: "", orderIndex: 1, metadata: { personName: "Dr. Sarah Park", personTitle: "Professor", personOrg: "UC Berkeley", relationship: "Technical Advisor", context: "Leading researcher in materials science and recycling technology" } as RelationshipBlockContent },
          { id: "fa-s3", blockType: "relationship", content: "", orderIndex: 2, metadata: { personName: "Michael Torres", personTitle: "Partner", personOrg: "Breakthrough Energy Ventures", relationship: "Investor & Advisor", context: "Deep expertise in climate tech scaling" } as RelationshipBlockContent },
        ],
      },
      {
        id: "pitch",
        key: "pitch",
        label: "Pitch",
        visibility: "public",
        orderIndex: 2,
        blocks: [
          { id: "fa-p1", blockType: "text", content: "**The Problem**: Solar adoption is exploding, but we have no plan for end-of-life panels. By 2030, 1M tons of solar waste annually—most going to landfills.\n\n**Our Solution**: SolarLoop builds recycling infrastructure that recovers 95% of panel materials at cost parity with landfill disposal.", orderIndex: 0 },
        ],
      },
      {
        id: "traction",
        key: "traction",
        label: "Traction",
        visibility: "public",
        orderIndex: 3,
        blocks: [
          { id: "fa-t1", blockType: "metric", content: "", orderIndex: 0, metadata: { value: 12000, label: "Panels Processed", change: 50, period: "quarter", format: "number" } as MetricBlockContent },
          { id: "fa-t2", blockType: "metric", content: "", orderIndex: 1, metadata: { value: 95, label: "Material Recovery Rate", unit: "%", format: "percent" } as MetricBlockContent },
          { id: "fa-t3", blockType: "metric", content: "", orderIndex: 2, metadata: { value: 3, label: "Installer LOIs", format: "number" } as MetricBlockContent },
          { id: "fa-t4", blockType: "metric", content: "", orderIndex: 3, metadata: { value: 750000, label: "DOE Grant", unit: "USD", format: "currency" } as MetricBlockContent },
          { id: "fa-t5", blockType: "milestone", content: "", orderIndex: 4, metadata: { title: "Pilot Facility Operational", date: "2025-08-01", description: "First commercial-scale recycling facility in Oakland", type: "release" } as MilestoneBlockContent },
          { id: "fa-t6", blockType: "milestone", content: "", orderIndex: 5, metadata: { title: "DOE Grant Awarded", date: "2025-05-15", description: "$750K for R&D expansion", type: "achievement" } as MilestoneBlockContent },
        ],
      },
      {
        id: "documents",
        key: "documents",
        label: "Documents",
        visibility: "private",
        orderIndex: 4,
        blocks: [
          { id: "fa-d1", blockType: "text", content: "Technical whitepaper and investor materials available.", orderIndex: 0 },
        ],
      },
    ],
  },

  // ── Jordan Taylor / HealthStack (15% complete, entry stage, inactive) ──
  jt: {
    memberId: "jt",
    identity: {
      name: "Jordan Taylor",
      title: "Founder at HealthStack",
      bio: "Building better healthcare access.",
      location: "Brooklyn, NY",
      skills: ["Healthcare"],
      links: [],
      email: "jordan@healthstack.io",
    },
    rooms: [
      {
        id: "identity",
        key: "identity",
        label: "Identity",
        visibility: "public",
        orderIndex: 0,
        blocks: [
          { id: "jt-i1", blockType: "text", content: "Working on healthcare access for underserved communities.", orderIndex: 0 },
        ],
      },
      {
        id: "startup",
        key: "startup",
        label: "Startup",
        visibility: "public",
        orderIndex: 1,
        blocks: [], // Empty - inactive member
      },
      {
        id: "pitch",
        key: "pitch",
        label: "Pitch",
        visibility: "public",
        orderIndex: 2,
        blocks: [], // Empty
      },
      {
        id: "traction",
        key: "traction",
        label: "Traction",
        visibility: "public",
        orderIndex: 3,
        blocks: [], // Empty
      },
      {
        id: "documents",
        key: "documents",
        label: "Documents",
        visibility: "private",
        orderIndex: 4,
        blocks: [], // Empty
      },
    ],
  },

  // ── Devon Brown / LogiSync (60% complete, foundation stage) ──
  db: {
    memberId: "db",
    identity: {
      name: "Devon Brown",
      title: "CEO at LogiSync",
      bio: "Optimizing last-mile logistics for small businesses. Former ops lead at Amazon. Wharton MBA.",
      location: "Dallas, TX",
      skills: ["Logistics", "Operations", "Enterprise Sales", "SaaS"],
      links: [
        { label: "LinkedIn", url: "https://linkedin.com/in/devonbrownlogistics" },
      ],
      email: "devon@logisync.com",
    },
    rooms: [
      {
        id: "identity",
        key: "identity",
        label: "Identity",
        visibility: "public",
        orderIndex: 0,
        blocks: [
          { id: "db-i1", blockType: "text", content: "Spent 7 years at Amazon building logistics systems. Now bringing enterprise-grade delivery optimization to small and mid-size businesses.", orderIndex: 0 },
          { id: "db-i2", blockType: "experience", content: "", orderIndex: 1, metadata: { title: "Operations Manager", organization: "Amazon Logistics", location: "Seattle, WA", startDate: "2017-06", endDate: "2024-02", description: "Managed last-mile delivery operations for Pacific Northwest region", highlights: ["Reduced delivery costs by 22%", "Led team of 150+"], skills: ["Operations", "Logistics", "Team Leadership"] } as ExperienceBlockContent },
          { id: "db-i3", blockType: "education", content: "", orderIndex: 2, metadata: { institution: "Wharton School of Business", degree: "MBA", field: "Operations Management", startDate: "2015", endDate: "2017" } as EducationBlockContent },
        ],
      },
      {
        id: "startup",
        key: "startup",
        label: "Startup",
        visibility: "public",
        orderIndex: 1,
        blocks: [
          { id: "db-s1", blockType: "project", content: "", orderIndex: 0, metadata: { title: "LogiSync", description: "Route optimization and delivery management platform for SMB retailers. We reduce delivery costs by 30% through AI-powered routing and real-time tracking.", status: "in_progress", skills: ["Logistics", "AI", "SaaS"], highlights: ["45 business customers", "Processing 8K deliveries/month"], metrics: [{ label: "Customers", value: "45" }, { label: "Deliveries/mo", value: "8K" }] } as ProjectBlockContent },
        ],
      },
      {
        id: "pitch",
        key: "pitch",
        label: "Pitch",
        visibility: "public",
        orderIndex: 2,
        blocks: [
          { id: "db-p1", blockType: "text", content: "Small retailers lose 15% of revenue to inefficient delivery. LogiSync brings Amazon-level logistics intelligence to businesses with 10-500 deliveries per day.", orderIndex: 0 },
          { id: "db-p2", blockType: "text", content: "Currently raising seed round to expand sales team and build integrations with Shopify and Square.", orderIndex: 1 },
        ],
      },
      {
        id: "traction",
        key: "traction",
        label: "Traction",
        visibility: "public",
        orderIndex: 3,
        blocks: [
          { id: "db-t1", blockType: "metric", content: "", orderIndex: 0, metadata: { value: 45, label: "Business Customers", change: 20, period: "month", format: "number" } as MetricBlockContent },
          { id: "db-t2", blockType: "metric", content: "", orderIndex: 1, metadata: { value: 8000, label: "Deliveries per Month", change: 35, period: "month", format: "number" } as MetricBlockContent },
          { id: "db-t3", blockType: "metric", content: "", orderIndex: 2, metadata: { value: 30, label: "Avg Cost Reduction", unit: "%", format: "percent" } as MetricBlockContent },
          { id: "db-t4", blockType: "milestone", content: "", orderIndex: 3, metadata: { title: "First Enterprise Customer", date: "2025-12-01", description: "Signed regional grocery chain with 12 locations", type: "achievement" } as MilestoneBlockContent },
        ],
      },
      {
        id: "documents",
        key: "documents",
        label: "Documents",
        visibility: "private",
        orderIndex: 4,
        blocks: [], // Empty - incomplete profile
      },
    ],
  },
};

// ── Directory Members (derived from STUB_MEMBERS + artefacts) ────────────────

export type DirectoryMember = {
  id: string;
  name: string;
  role: string;
  company: string;
  stage: string;
  engagement: number;
  lifecycle: "new" | "active" | "dormant";
  eventsAttended: number;
  bio: string;
  skills: string[];
};

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    entry: "Pre-seed",
    foundation: "Seed",
    development: "Seed",
    showcase: "Series A",
  };
  return labels[stage] || stage;
}

function deriveLifecycle(member: DashboardMember): "new" | "active" | "dormant" {
  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(member.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceActivity >= 7) return "dormant";
  if (member.accepted <= 1) return "new";
  return "active";
}

export const DIRECTORY_MEMBERS: DirectoryMember[] = STUB_MEMBERS.map((m) => {
  const artefact = MOCK_MEMBER_ARTEFACTS[m.id];
  return {
    id: m.id,
    name: m.name,
    role: m.title,
    company: m.company || "",
    stage: getStageLabel(m.stage),
    engagement: Math.round((m.accepted / m.sections) * 100),
    lifecycle: deriveLifecycle(m),
    eventsAttended: m.activityCount,
    bio: artefact?.identity.bio || "",
    skills: artefact?.identity.skills || [],
  };
});

// ── Data Functions ───────────────────────────────────────────────────────────

export async function getCommunity(communityId: string): Promise<CommunityConfig | null> {
  // Stub: return mock community
  if (communityId === "test" || communityId === "bfn-winter-2025") {
    return STUB_COMMUNITY;
  }
  return null;
}

export async function getCommunityMembers(communityId: string): Promise<DashboardMember[]> {
  // Stub: return mock members
  return STUB_MEMBERS;
}

export async function getActivityFeed(communityId: string, limit = 10): Promise<ActivityItem[]> {
  // Stub: return mock activity
  return STUB_ACTIVITY.slice(0, limit);
}

export async function getAlerts(communityId: string): Promise<Alert[]> {
  // Stub: return mock alerts
  return STUB_ALERTS;
}

export async function getDashboardStats(communityId: string): Promise<DashboardStats> {
  const members = await getCommunityMembers(communityId);
  const activity = await getActivityFeed(communityId, 100);

  // Activity this week (last 7 days)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activityThisWeek = activity.filter(a => new Date(a.timestamp).getTime() > weekAgo).length;

  // Calculate status counts
  const statusCounts = {
    complete: 0,
    inProgress: 0,
    behind: 0,
    needsAttention: 0,
    notStarted: 0,
  };

  members.forEach(member => {
    const status = getMemberStatus(member);
    switch (status) {
      case "complete": statusCounts.complete++; break;
      case "in_progress": statusCounts.inProgress++; break;
      case "behind": statusCounts.behind++; break;
      case "needs_attention": statusCounts.needsAttention++; break;
      case "not_started": statusCounts.notStarted++; break;
    }
  });

  return {
    memberCount: members.length,
    activityThisWeek,
    statusCounts,
  };
}

export async function getCohortProgressMap(communityId: string): Promise<CohortProgressMap> {
  const community = await getCommunity(communityId);
  const members = await getCommunityMembers(communityId);

  if (!community) {
    return { rooms: [] };
  }

  const rooms = community.rooms.map(room => {
    let completed = 0;
    let inProgress = 0;
    let empty = 0;

    members.forEach(member => {
      const roomProgress = member.roomProgress.find(rp => rp.roomKey === room.key);
      if (!roomProgress || roomProgress.status === "empty") {
        empty++;
      } else if (roomProgress.status === "accepted" || roomProgress.completionPercent === 100) {
        completed++;
      } else {
        inProgress++;
      }
    });

    return {
      key: room.key,
      label: room.label,
      completedCount: completed,
      inProgressCount: inProgress,
      emptyCount: empty,
      totalMembers: members.length,
    };
  });

  return { rooms };
}

// ── Utility Functions ────────────────────────────────────────────────────────

/**
 * Compute member status based on room progress and activity
 * - complete: all rooms accepted
 * - in_progress: actively working (recent activity, some rooms done)
 * - behind: some progress but no recent activity (3+ days)
 * - needs_attention: at risk flag or 7+ days inactive
 * - not_started: no rooms completed
 */
export function getMemberStatus(member: DashboardMember): MemberStatus {
  const completedRooms = member.roomProgress.filter(
    r => r.status === "accepted"
  ).length;
  const totalRooms = member.roomProgress.length;
  const hasAnyProgress = member.roomProgress.some(
    r => r.status !== "empty"
  );

  // Calculate days since last activity
  const lastActivityTime = new Date(member.lastActivity).getTime();
  const daysSinceActivity = Math.floor((Date.now() - lastActivityTime) / (1000 * 60 * 60 * 24));

  // All rooms complete
  if (completedRooms === totalRooms) {
    return "complete";
  }

  // Risk flag or inactive for 7+ days with some progress
  if (member.risk || (daysSinceActivity >= 7 && hasAnyProgress)) {
    return "needs_attention";
  }

  // No progress at all
  if (!hasAnyProgress || completedRooms === 0) {
    return "not_started";
  }

  // Some progress but inactive for 3+ days
  if (daysSinceActivity >= 3) {
    return "behind";
  }

  // Active and making progress
  return "in_progress";
}

export function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// ── Search Functions ──────────────────────────────────────────────────────────

export type SearchResult = {
  member: DirectoryMember;
  artefact: MockMemberArtefact | null;
  matchedFields: string[];
  score: number;
};

/**
 * Search community members and their artefact content
 * Searches across: name, company, bio, skills, room content, metrics, etc.
 */
export async function searchCommunityMembers(
  communityId: string,
  query: string,
  options?: {
    limit?: number;
    stage?: string;
    lifecycle?: "new" | "active" | "dormant";
    minEngagement?: number;
  }
): Promise<SearchResult[]> {
  const { limit = 20, stage, lifecycle, minEngagement } = options || {};
  const queryLower = query.toLowerCase().trim();

  if (!queryLower) {
    return DIRECTORY_MEMBERS.slice(0, limit).map(m => ({
      member: m,
      artefact: MOCK_MEMBER_ARTEFACTS[m.id] || null,
      matchedFields: [],
      score: 0,
    }));
  }

  const results: SearchResult[] = [];
  const queryTerms = queryLower.split(/\s+/);

  for (const member of DIRECTORY_MEMBERS) {
    // Apply filters
    if (stage && member.stage.toLowerCase() !== stage.toLowerCase()) continue;
    if (lifecycle && member.lifecycle !== lifecycle) continue;
    if (minEngagement && member.engagement < minEngagement) continue;

    const artefact = MOCK_MEMBER_ARTEFACTS[member.id] || null;
    const matchedFields: string[] = [];
    let score = 0;

    // Search member fields
    if (member.name.toLowerCase().includes(queryLower)) {
      matchedFields.push("name");
      score += 10;
    }
    if (member.company.toLowerCase().includes(queryLower)) {
      matchedFields.push("company");
      score += 8;
    }
    if (member.bio.toLowerCase().includes(queryLower)) {
      matchedFields.push("bio");
      score += 5;
    }
    if (member.skills.some(s => s.toLowerCase().includes(queryLower))) {
      matchedFields.push("skills");
      score += 6;
    }

    // Search artefact content
    if (artefact) {
      // Search identity
      const identity = artefact.identity;
      for (const term of queryTerms) {
        if (identity.bio.toLowerCase().includes(term)) {
          score += 3;
        }
        if (identity.skills.some(s => s.toLowerCase().includes(term))) {
          score += 4;
        }
      }

      // Search room blocks
      for (const room of artefact.rooms) {
        for (const block of room.blocks) {
          const content = block.content?.toLowerCase() || "";
          const metadata = JSON.stringify(block.metadata || {}).toLowerCase();

          for (const term of queryTerms) {
            if (content.includes(term)) {
              if (!matchedFields.includes(`room:${room.label}`)) {
                matchedFields.push(`room:${room.label}`);
              }
              score += 2;
            }
            if (metadata.includes(term)) {
              if (!matchedFields.includes(`block:${block.blockType}`)) {
                matchedFields.push(`block:${block.blockType}`);
              }
              score += 2;
            }
          }

          // Boost for specific block types
          if (block.blockType === "metric" && block.metadata) {
            const m = block.metadata as MetricBlockContent;
            if (m.label?.toLowerCase().includes(queryLower)) {
              score += 5;
              matchedFields.push("metric");
            }
          }
          if (block.blockType === "project" && block.metadata) {
            const p = block.metadata as ProjectBlockContent;
            if (p.title?.toLowerCase().includes(queryLower) ||
                p.description?.toLowerCase().includes(queryLower)) {
              score += 5;
              matchedFields.push("project");
            }
          }
          if (block.blockType === "skill" && block.metadata) {
            const s = block.metadata as SkillBlockContent;
            if (s.name?.toLowerCase().includes(queryLower)) {
              score += 4;
              matchedFields.push("skill");
            }
          }
        }
      }
    }

    if (score > 0 || matchedFields.length > 0) {
      results.push({ member, artefact, matchedFields, score });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Get members filtered by stage, lifecycle, or engagement
 */
export async function getFilteredMembers(
  communityId: string,
  filters: {
    stage?: string;
    lifecycle?: "new" | "active" | "dormant";
    minEngagement?: number;
    maxEngagement?: number;
  }
): Promise<DirectoryMember[]> {
  return DIRECTORY_MEMBERS.filter(m => {
    if (filters.stage && m.stage.toLowerCase() !== filters.stage.toLowerCase()) return false;
    if (filters.lifecycle && m.lifecycle !== filters.lifecycle) return false;
    if (filters.minEngagement && m.engagement < filters.minEngagement) return false;
    if (filters.maxEngagement && m.engagement > filters.maxEngagement) return false;
    return true;
  });
}

/**
 * Get member by ID with full artefact data
 */
export async function getMemberWithArtefact(
  memberId: string
): Promise<{ member: DirectoryMember; artefact: MockMemberArtefact } | null> {
  const member = DIRECTORY_MEMBERS.find(m => m.id === memberId);
  if (!member) return null;

  const artefact = MOCK_MEMBER_ARTEFACTS[memberId];
  if (!artefact) return null;

  return { member, artefact };
}
