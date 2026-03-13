"use client";

import { useState, useRef, useMemo, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useC, useTheme } from "@/hooks/useC";
import { FADE } from "@/lib/motion";
import { Lbl } from "@/components/primitives/Lbl";
import { useCardColors } from "@/components/artefact/hooks/useCardColors";
import { CompactRenderer } from "@/components/artefact/views/renderers/CompactRenderer";
import { ExpandedRenderer } from "@/components/artefact/views/renderers/ExpandedRenderer";
import { GuestArtefactCtx, type GuestArtefactContextValue } from "@/context/GuestArtefactContext";
import type { GuestArtefactState, StandaloneRoom, Identity } from "@/types/artefact";
import type { ArtefactState, LifecycleState } from "@/types/events";
import { PageComposer, ViewToggle, MemberDirectoryPreview, getTemplateForRoom, getPresetOptions } from "./sections";
import type { PreviewViewMode } from "./sections";

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardStep = {
  id: string;
  num: number;
  label: string;
};

type BlockLayout = "headline" | "body" | "metric" | "media" | "two-column" | "bullet";

type BlockTemplate = {
  id: string;
  type: string;
  label: string;
  prompt: string;
  required: boolean;
  layout: BlockLayout;
  slideOrder: number;
};

type RoomSemantic = "about" | "projects" | "metrics" | "timeline" | "custom";

type RoomTemplate = {
  id: string;
  label: string;
  type: RoomSemantic;
  shared: boolean;
  visibility: "public" | "community" | "private";
  blocks: BlockTemplate[];
  preset?: string;
};

type DirectoryConfig = {
  visibility: "public" | "community";
  cardFields: string[];
  sortFields: string[];
  searchFields: string[];
  filters: { industry: boolean; skills: boolean; stage: boolean };
};

type CommunityConfig = {
  theme: "auto" | "light" | "warm" | "dark";
  textSize: "S" | "M" | "L";
  density: "list" | "compact";
  rooms: RoomTemplate[];
  directory: DirectoryConfig;
};

// ── Community Presets ─────────────────────────────────────────────────────────

type CommunityPreset = {
  id: string;
  label: string;
  description: string;
  rooms: RoomTemplate[];
  sampleData: Record<string, string>;
  directory: DirectoryConfig;
};

const COMMUNITY_PRESETS: CommunityPreset[] = [
  // ── Startup Accelerator ─────────────────────────────────────────────────────
  {
    id: "accelerator",
    label: "Startup Accelerator",
    description: "For accelerators, incubators, and founder programs",
    rooms: [
      {
        id: "identity", label: "Founder", type: "about",
        shared: false, visibility: "public",
        blocks: [
          { id: "name", type: "text", label: "Name", prompt: "Your full name", required: true, layout: "headline", slideOrder: 0 },
          { id: "title", type: "text", label: "Title", prompt: "Your role (e.g. Founder & CEO)", required: true, layout: "body", slideOrder: 1 },
          { id: "bio", type: "text", label: "Bio", prompt: "Short bio about yourself", required: true, layout: "body", slideOrder: 2 },
          { id: "photo", type: "image", label: "Photo", prompt: "Profile photo", required: false, layout: "media", slideOrder: 3 },
          { id: "linkedin", type: "link", label: "LinkedIn", prompt: "Your LinkedIn profile", required: false, layout: "body", slideOrder: 4 },
        ]
      },
      {
        id: "startup", label: "Startup", type: "projects",
        shared: true, visibility: "community",
        blocks: [
          { id: "startup_name", type: "text", label: "Company Name", prompt: "Your startup name", required: true, layout: "headline", slideOrder: 0 },
          { id: "one_liner", type: "text", label: "One-liner", prompt: "What you do in one sentence", required: true, layout: "body", slideOrder: 1 },
          { id: "stage", type: "text", label: "Stage", prompt: "Idea, Pre-seed, Seed, Series A, etc.", required: true, layout: "metric", slideOrder: 2 },
          { id: "industry", type: "text", label: "Industry", prompt: "Your primary industry/sector", required: true, layout: "metric", slideOrder: 3 },
          { id: "website", type: "link", label: "Website", prompt: "Company website", required: false, layout: "body", slideOrder: 4 },
        ]
      },
      {
        id: "pitch", label: "Pitch", type: "custom",
        shared: true, visibility: "public",
        blocks: [
          { id: "problem", type: "text", label: "Problem", prompt: "The problem you're solving", required: true, layout: "headline", slideOrder: 0 },
          { id: "solution", type: "text", label: "Solution", prompt: "Your unique solution", required: true, layout: "body", slideOrder: 1 },
          { id: "market", type: "text", label: "Market", prompt: "Market size and opportunity", required: true, layout: "body", slideOrder: 2 },
          { id: "traction", type: "text", label: "Traction", prompt: "Key achievements and milestones", required: true, layout: "body", slideOrder: 3 },
          { id: "demo", type: "embed", label: "Demo", prompt: "Loom or video demo URL", required: false, layout: "media", slideOrder: 4 },
          { id: "ask", type: "text", label: "The Ask", prompt: "What you're looking for (funding, advisors, etc.)", required: false, layout: "headline", slideOrder: 5 },
        ]
      },
      {
        id: "traction", label: "Metrics", type: "metrics",
        shared: true, visibility: "private",
        blocks: [
          { id: "mrr", type: "metric", label: "MRR", prompt: "Monthly recurring revenue", required: false, layout: "metric", slideOrder: 0 },
          { id: "users", type: "metric", label: "Users", prompt: "Active users or customers", required: false, layout: "metric", slideOrder: 1 },
          { id: "growth", type: "metric", label: "Growth", prompt: "Month-over-month growth %", required: false, layout: "metric", slideOrder: 2 },
          { id: "runway", type: "metric", label: "Runway", prompt: "Months of runway remaining", required: false, layout: "metric", slideOrder: 3 },
        ]
      },
      {
        id: "documents", label: "Documents", type: "custom",
        shared: true, visibility: "community",
        blocks: [
          { id: "deck", type: "document", label: "Pitch Deck", prompt: "Upload your pitch deck", required: false, layout: "media", slideOrder: 0 },
          { id: "one_pager", type: "document", label: "One Pager", prompt: "Company one-pager", required: false, layout: "media", slideOrder: 1 },
          { id: "financials", type: "document", label: "Financials", prompt: "Financial projections", required: false, layout: "media", slideOrder: 2 },
        ]
      }
    ],
    sampleData: {
      name: "Kwame Mensah",
      title: "Founder & CEO",
      bio: "Serial entrepreneur building AI infrastructure for communities. Previously founded DataStack (acquired 2021).",
      linkedin: "https://linkedin.com/in/kwamemensah",
      startup_name: "Artefact Labs",
      one_liner: "Portfolio management infrastructure for founder communities.",
      stage: "Seed",
      industry: "B2B SaaS",
      website: "https://artefact.dev",
      problem: "Accelerators track founders in spreadsheets and lose context between cohorts.",
      solution: "Structured artefacts that capture founder journeys and make portfolio insights searchable.",
      market: "$4B founder community tools market, growing 28% annually.",
      traction: "127 communities onboarded, 3,400 founders using the platform.",
      demo: "https://loom.com/share/demo",
      ask: "Raising $2M seed to expand enterprise sales team.",
      mrr: "$24,000",
      users: "3,400",
      growth: "18%",
      runway: "14",
      deck: "pitch-deck.pdf",
      one_pager: "one-pager.pdf",
    },
    directory: {
      visibility: "community",
      cardFields: ["name", "startup_name", "stage"],
      sortFields: ["name", "stage"],
      searchFields: ["name", "startup_name", "industry"],
      filters: { industry: true, skills: false, stage: true },
    },
  },

  // ── Investment Fund / VC ────────────────────────────────────────────────────
  {
    id: "fund",
    label: "Investment Fund",
    description: "For VCs, angels, and investment syndicates",
    rooms: [
      {
        id: "identity", label: "Investor", type: "about",
        shared: false, visibility: "public",
        blocks: [
          { id: "name", type: "text", label: "Name", prompt: "Your full name", required: true, layout: "headline", slideOrder: 0 },
          { id: "title", type: "text", label: "Role", prompt: "Partner, Principal, Associate, etc.", required: true, layout: "body", slideOrder: 1 },
          { id: "bio", type: "text", label: "Bio", prompt: "Investment background and thesis", required: true, layout: "body", slideOrder: 2 },
          { id: "photo", type: "image", label: "Photo", prompt: "Profile photo", required: false, layout: "media", slideOrder: 3 },
          { id: "linkedin", type: "link", label: "LinkedIn", prompt: "Your LinkedIn profile", required: false, layout: "body", slideOrder: 4 },
          { id: "twitter", type: "link", label: "Twitter/X", prompt: "Your Twitter/X profile", required: false, layout: "body", slideOrder: 5 },
        ]
      },
      {
        id: "thesis", label: "Thesis", type: "custom",
        shared: true, visibility: "public",
        blocks: [
          { id: "focus", type: "text", label: "Focus Areas", prompt: "Industries and verticals you invest in", required: true, layout: "headline", slideOrder: 0 },
          { id: "stage_pref", type: "text", label: "Stage", prompt: "Pre-seed to Series B, etc.", required: true, layout: "metric", slideOrder: 1 },
          { id: "check_size", type: "text", label: "Check Size", prompt: "Typical investment range", required: true, layout: "metric", slideOrder: 2 },
          { id: "thesis_detail", type: "text", label: "Investment Thesis", prompt: "What excites you about founders", required: true, layout: "body", slideOrder: 3 },
          { id: "value_add", type: "text", label: "Value Add", prompt: "How you help portfolio companies", required: true, layout: "body", slideOrder: 4 },
        ]
      },
      {
        id: "portfolio", label: "Portfolio", type: "projects",
        shared: true, visibility: "public",
        blocks: [
          { id: "notable_1", type: "text", label: "Notable Investment 1", prompt: "Company name and outcome", required: false, layout: "body", slideOrder: 0 },
          { id: "notable_2", type: "text", label: "Notable Investment 2", prompt: "Company name and outcome", required: false, layout: "body", slideOrder: 1 },
          { id: "notable_3", type: "text", label: "Notable Investment 3", prompt: "Company name and outcome", required: false, layout: "body", slideOrder: 2 },
          { id: "portfolio_link", type: "link", label: "Full Portfolio", prompt: "Link to full portfolio page", required: false, layout: "body", slideOrder: 3 },
        ]
      },
      {
        id: "dealflow", label: "Deal Flow", type: "custom",
        shared: false, visibility: "private",
        blocks: [
          { id: "sourcing", type: "text", label: "Sourcing Notes", prompt: "How you found interesting deals this week", required: false, layout: "body", slideOrder: 0 },
          { id: "pipeline", type: "text", label: "Pipeline", prompt: "Current deals in diligence", required: false, layout: "body", slideOrder: 1 },
          { id: "passed", type: "text", label: "Passed Deals", prompt: "Recent passes and reasons", required: false, layout: "body", slideOrder: 2 },
        ]
      },
    ],
    sampleData: {
      name: "Sarah Chen",
      title: "General Partner",
      bio: "GP at Horizon Ventures. 15 years in tech, former VP Product at Stripe. Led investments in 40+ companies with 3 unicorns.",
      linkedin: "https://linkedin.com/in/sarahchen",
      twitter: "https://twitter.com/sarahchen",
      focus: "Fintech, Developer Tools, AI Infrastructure",
      stage_pref: "Seed to Series A",
      check_size: "$500K - $3M",
      thesis_detail: "We back technical founders building infrastructure that makes developers 10x more productive.",
      value_add: "Product strategy, go-to-market playbooks, enterprise sales intros, and follow-on connections.",
      notable_1: "Dataflow (acquired by Snowflake, $340M)",
      notable_2: "CodeShip (Series C, $2B valuation)",
      notable_3: "FinAPI (Series B, $500M valuation)",
      portfolio_link: "https://horizonvc.com/portfolio",
      sourcing: "Met 3 promising AI infra founders at Cerebral Valley this week.",
      pipeline: "Deep in diligence on an observability platform.",
      passed: "Passed on crypto gaming - market timing concerns.",
    },
    directory: {
      visibility: "community",
      cardFields: ["name", "focus", "check_size"],
      sortFields: ["name", "check_size"],
      searchFields: ["name", "focus", "thesis_detail"],
      filters: { industry: true, skills: false, stage: true },
    },
  },

  // ── Creative Agency ─────────────────────────────────────────────────────────
  {
    id: "agency",
    label: "Creative Agency",
    description: "For design studios, creative collectives, and agencies",
    rooms: [
      {
        id: "identity", label: "Creative", type: "about",
        shared: false, visibility: "public",
        blocks: [
          { id: "name", type: "text", label: "Name", prompt: "Your full name", required: true, layout: "headline", slideOrder: 0 },
          { id: "role", type: "text", label: "Role", prompt: "Designer, Director, Strategist, etc.", required: true, layout: "body", slideOrder: 1 },
          { id: "bio", type: "text", label: "Bio", prompt: "Your creative background", required: true, layout: "body", slideOrder: 2 },
          { id: "photo", type: "image", label: "Photo", prompt: "Profile photo", required: false, layout: "media", slideOrder: 3 },
          { id: "portfolio_link", type: "link", label: "Portfolio", prompt: "Personal portfolio site", required: false, layout: "body", slideOrder: 4 },
        ]
      },
      {
        id: "skills", label: "Skills", type: "custom",
        shared: false, visibility: "public",
        blocks: [
          { id: "primary", type: "text", label: "Primary Skill", prompt: "Brand, Product, Motion, 3D, etc.", required: true, layout: "headline", slideOrder: 0 },
          { id: "tools", type: "text", label: "Tools", prompt: "Figma, After Effects, Blender, etc.", required: true, layout: "body", slideOrder: 1 },
          { id: "specialties", type: "text", label: "Specialties", prompt: "Industries or styles you excel in", required: true, layout: "body", slideOrder: 2 },
          { id: "experience", type: "metric", label: "Years Experience", prompt: "Years in the industry", required: false, layout: "metric", slideOrder: 3 },
        ]
      },
      {
        id: "work", label: "Work", type: "projects",
        shared: true, visibility: "public",
        blocks: [
          { id: "project_1", type: "text", label: "Project 1", prompt: "Client and project description", required: true, layout: "body", slideOrder: 0 },
          { id: "project_1_img", type: "image", label: "Project 1 Image", prompt: "Key visual from the project", required: false, layout: "media", slideOrder: 1 },
          { id: "project_2", type: "text", label: "Project 2", prompt: "Client and project description", required: false, layout: "body", slideOrder: 2 },
          { id: "project_2_img", type: "image", label: "Project 2 Image", prompt: "Key visual from the project", required: false, layout: "media", slideOrder: 3 },
          { id: "project_3", type: "text", label: "Project 3", prompt: "Client and project description", required: false, layout: "body", slideOrder: 4 },
          { id: "behance", type: "link", label: "Behance/Dribbble", prompt: "Full portfolio link", required: false, layout: "body", slideOrder: 5 },
        ]
      },
      {
        id: "availability", label: "Availability", type: "custom",
        shared: false, visibility: "community",
        blocks: [
          { id: "status", type: "text", label: "Status", prompt: "Available, Booked, Selective", required: true, layout: "headline", slideOrder: 0 },
          { id: "rate", type: "text", label: "Day Rate", prompt: "Your typical day rate", required: false, layout: "metric", slideOrder: 1 },
          { id: "location", type: "text", label: "Location", prompt: "Remote, On-site, Hybrid", required: false, layout: "metric", slideOrder: 2 },
          { id: "availability_notes", type: "text", label: "Notes", prompt: "Availability details", required: false, layout: "body", slideOrder: 3 },
        ]
      },
    ],
    sampleData: {
      name: "Maya Rodriguez",
      role: "Brand Designer",
      bio: "Award-winning brand designer with 8 years crafting identities for startups and Fortune 500s. Believer in design systems that scale.",
      portfolio_link: "https://mayarodriguez.design",
      primary: "Brand Identity",
      tools: "Figma, Illustrator, After Effects, Framer",
      specialties: "Tech brands, D2C, Visual identity systems",
      experience: "8",
      project_1: "Stripe - Led visual refresh for Stripe Atlas, their startup incorporation product.",
      project_2: "Notion - Created illustration system for Notion's enterprise launch campaign.",
      project_3: "Linear - Brand guidelines and marketing site redesign.",
      behance: "https://behance.net/mayarodriguez",
      status: "Selective",
      rate: "$1,500/day",
      location: "Remote (PST timezone)",
      availability_notes: "Taking on 2 new projects per quarter. Prefer 3-month minimum engagements.",
    },
    directory: {
      visibility: "public",
      cardFields: ["name", "primary", "status"],
      sortFields: ["name", "primary"],
      searchFields: ["name", "primary", "specialties"],
      filters: { industry: false, skills: true, stage: false },
    },
  },

  // ── Research Lab / Academic ─────────────────────────────────────────────────
  {
    id: "research",
    label: "Research Lab",
    description: "For academic labs, research groups, and think tanks",
    rooms: [
      {
        id: "identity", label: "Researcher", type: "about",
        shared: false, visibility: "public",
        blocks: [
          { id: "name", type: "text", label: "Name", prompt: "Your full name", required: true, layout: "headline", slideOrder: 0 },
          { id: "title", type: "text", label: "Title", prompt: "PhD Student, Postdoc, Professor, etc.", required: true, layout: "body", slideOrder: 1 },
          { id: "affiliation", type: "text", label: "Affiliation", prompt: "University or institution", required: true, layout: "body", slideOrder: 2 },
          { id: "bio", type: "text", label: "Bio", prompt: "Research interests and background", required: true, layout: "body", slideOrder: 3 },
          { id: "photo", type: "image", label: "Photo", prompt: "Profile photo", required: false, layout: "media", slideOrder: 4 },
          { id: "scholar", type: "link", label: "Google Scholar", prompt: "Scholar profile link", required: false, layout: "body", slideOrder: 5 },
        ]
      },
      {
        id: "research", label: "Research", type: "custom",
        shared: true, visibility: "public",
        blocks: [
          { id: "focus", type: "text", label: "Research Focus", prompt: "Primary research areas", required: true, layout: "headline", slideOrder: 0 },
          { id: "current", type: "text", label: "Current Project", prompt: "What you're working on now", required: true, layout: "body", slideOrder: 1 },
          { id: "methods", type: "text", label: "Methods", prompt: "Research methodologies you use", required: false, layout: "body", slideOrder: 2 },
          { id: "funding", type: "text", label: "Funding", prompt: "Active grants or funding sources", required: false, layout: "body", slideOrder: 3 },
        ]
      },
      {
        id: "publications", label: "Publications", type: "projects",
        shared: true, visibility: "public",
        blocks: [
          { id: "pub_1", type: "text", label: "Recent Paper 1", prompt: "Title, venue, year", required: true, layout: "body", slideOrder: 0 },
          { id: "pub_1_link", type: "link", label: "Paper 1 Link", prompt: "ArXiv or publication link", required: false, layout: "body", slideOrder: 1 },
          { id: "pub_2", type: "text", label: "Recent Paper 2", prompt: "Title, venue, year", required: false, layout: "body", slideOrder: 2 },
          { id: "pub_2_link", type: "link", label: "Paper 2 Link", prompt: "ArXiv or publication link", required: false, layout: "body", slideOrder: 3 },
          { id: "citations", type: "metric", label: "Citations", prompt: "Total citation count", required: false, layout: "metric", slideOrder: 4 },
          { id: "h_index", type: "metric", label: "h-index", prompt: "Your h-index", required: false, layout: "metric", slideOrder: 5 },
        ]
      },
      {
        id: "collaborations", label: "Collaborations", type: "custom",
        shared: false, visibility: "community",
        blocks: [
          { id: "seeking", type: "text", label: "Seeking", prompt: "Types of collaborations you're looking for", required: false, layout: "body", slideOrder: 0 },
          { id: "offering", type: "text", label: "Offering", prompt: "Expertise or resources you can share", required: false, layout: "body", slideOrder: 1 },
          { id: "open_problems", type: "text", label: "Open Problems", prompt: "Interesting questions in your field", required: false, layout: "body", slideOrder: 2 },
        ]
      },
    ],
    sampleData: {
      name: "Dr. James Liu",
      title: "Assistant Professor",
      affiliation: "MIT Computer Science & Artificial Intelligence Lab",
      bio: "I study how large language models reason and fail. My work spans interpretability, evaluation, and human-AI collaboration.",
      scholar: "https://scholar.google.com/citations?user=jamesliu",
      focus: "AI Safety, Mechanistic Interpretability, LLM Evaluation",
      current: "Developing new methods to understand circuit-level computation in transformer models.",
      methods: "Causal interventions, probing classifiers, behavioral evaluations",
      funding: "NSF CAREER Award, OpenAI Superalignment Grant",
      pub_1: "Towards Monosemanticity: Decomposing Language Models, Nature 2024",
      pub_1_link: "https://arxiv.org/abs/2024.monosemanticity",
      pub_2: "Evaluating the Emergent World Model in GPT-4, ICML 2024",
      pub_2_link: "https://arxiv.org/abs/2024.worldmodel",
      citations: "4,230",
      h_index: "18",
      seeking: "Industry collaborations for compute access, co-advising opportunities",
      offering: "Interpretability expertise, evaluation frameworks, access to custom datasets",
      open_problems: "How do we measure whether a model truly understands vs pattern matches?",
    },
    directory: {
      visibility: "public",
      cardFields: ["name", "focus", "affiliation"],
      sortFields: ["name", "citations"],
      searchFields: ["name", "focus", "current"],
      filters: { industry: false, skills: true, stage: false },
    },
  },

  // ── Freelancer Network ──────────────────────────────────────────────────────
  {
    id: "freelancer",
    label: "Freelancer Network",
    description: "For consultants, contractors, and independent professionals",
    rooms: [
      {
        id: "identity", label: "Profile", type: "about",
        shared: false, visibility: "public",
        blocks: [
          { id: "name", type: "text", label: "Name", prompt: "Your full name", required: true, layout: "headline", slideOrder: 0 },
          { id: "headline", type: "text", label: "Headline", prompt: "What you do in one line", required: true, layout: "body", slideOrder: 1 },
          { id: "bio", type: "text", label: "Bio", prompt: "Your background and approach", required: true, layout: "body", slideOrder: 2 },
          { id: "photo", type: "image", label: "Photo", prompt: "Profile photo", required: false, layout: "media", slideOrder: 3 },
          { id: "website", type: "link", label: "Website", prompt: "Your personal site", required: false, layout: "body", slideOrder: 4 },
        ]
      },
      {
        id: "services", label: "Services", type: "custom",
        shared: true, visibility: "public",
        blocks: [
          { id: "primary_service", type: "text", label: "Primary Service", prompt: "Your main offering", required: true, layout: "headline", slideOrder: 0 },
          { id: "services_list", type: "text", label: "All Services", prompt: "List of services you offer", required: true, layout: "body", slideOrder: 1 },
          { id: "ideal_client", type: "text", label: "Ideal Client", prompt: "Who you work best with", required: true, layout: "body", slideOrder: 2 },
          { id: "process", type: "text", label: "Process", prompt: "How you typically work", required: false, layout: "body", slideOrder: 3 },
        ]
      },
      {
        id: "rates", label: "Rates", type: "metrics",
        shared: false, visibility: "community",
        blocks: [
          { id: "hourly", type: "metric", label: "Hourly Rate", prompt: "Your hourly rate", required: false, layout: "metric", slideOrder: 0 },
          { id: "project_min", type: "metric", label: "Project Minimum", prompt: "Minimum project engagement", required: false, layout: "metric", slideOrder: 1 },
          { id: "retainer", type: "metric", label: "Monthly Retainer", prompt: "Typical retainer rate", required: false, layout: "metric", slideOrder: 2 },
          { id: "availability", type: "text", label: "Availability", prompt: "Current availability status", required: true, layout: "headline", slideOrder: 3 },
        ]
      },
      {
        id: "testimonials", label: "Testimonials", type: "custom",
        shared: true, visibility: "public",
        blocks: [
          { id: "testimonial_1", type: "text", label: "Testimonial 1", prompt: "Client quote with name", required: false, layout: "body", slideOrder: 0 },
          { id: "testimonial_2", type: "text", label: "Testimonial 2", prompt: "Client quote with name", required: false, layout: "body", slideOrder: 1 },
          { id: "clients", type: "text", label: "Notable Clients", prompt: "Companies you've worked with", required: false, layout: "body", slideOrder: 2 },
        ]
      },
    ],
    sampleData: {
      name: "Alex Rivera",
      headline: "Fractional CTO for seed-stage startups",
      bio: "I help technical founders ship their MVP in 90 days. 12 years engineering experience at Google and 3 startups. I've seen what works.",
      website: "https://alexrivera.dev",
      primary_service: "Fractional CTO",
      services_list: "Technical architecture, MVP development, Engineering hiring, Code review, Investor due diligence",
      ideal_client: "Seed-stage startups with a non-technical founder who need to ship fast and hire their first engineer.",
      process: "1. Two-week architecture sprint, 2. Weekly sync + async support, 3. Handoff to your new team.",
      hourly: "$300",
      project_min: "$15,000",
      retainer: "$8,000/mo",
      availability: "2 slots available",
      testimonial_1: "\"Alex helped us go from idea to launched product in 8 weeks. Worth every penny.\" — Sarah Kim, Founder @ Bloom",
      testimonial_2: "\"The architecture Alex designed scaled to 100K users without a hiccup.\" — Marcus Chen, CEO @ DataFlow",
      clients: "Stripe, Y Combinator companies, Techstars Atlanta cohort",
    },
    directory: {
      visibility: "community",
      cardFields: ["name", "primary_service", "availability"],
      sortFields: ["name", "hourly"],
      searchFields: ["name", "primary_service", "services_list"],
      filters: { industry: true, skills: true, stage: false },
    },
  },

  // ── Developer Community ─────────────────────────────────────────────────────
  {
    id: "devs",
    label: "Developer Community",
    description: "For developer groups, OSS maintainers, and tech communities",
    rooms: [
      {
        id: "identity", label: "Developer", type: "about",
        shared: false, visibility: "public",
        blocks: [
          { id: "name", type: "text", label: "Name", prompt: "Your name or handle", required: true, layout: "headline", slideOrder: 0 },
          { id: "tagline", type: "text", label: "Tagline", prompt: "What you build or work on", required: true, layout: "body", slideOrder: 1 },
          { id: "bio", type: "text", label: "Bio", prompt: "Your dev journey", required: true, layout: "body", slideOrder: 2 },
          { id: "photo", type: "image", label: "Photo", prompt: "Profile photo", required: false, layout: "media", slideOrder: 3 },
          { id: "github", type: "link", label: "GitHub", prompt: "Your GitHub profile", required: true, layout: "body", slideOrder: 4 },
          { id: "twitter", type: "link", label: "Twitter/X", prompt: "Your Twitter/X", required: false, layout: "body", slideOrder: 5 },
        ]
      },
      {
        id: "stack", label: "Stack", type: "custom",
        shared: true, visibility: "public",
        blocks: [
          { id: "languages", type: "text", label: "Languages", prompt: "Languages you know well", required: true, layout: "body", slideOrder: 0 },
          { id: "frameworks", type: "text", label: "Frameworks", prompt: "Frameworks and tools you use", required: true, layout: "body", slideOrder: 1 },
          { id: "interests", type: "text", label: "Interests", prompt: "Areas you're exploring", required: true, layout: "body", slideOrder: 2 },
          { id: "experience", type: "metric", label: "Years Coding", prompt: "Years of experience", required: false, layout: "metric", slideOrder: 3 },
        ]
      },
      {
        id: "projects", label: "Projects", type: "projects",
        shared: true, visibility: "public",
        blocks: [
          { id: "project_1", type: "text", label: "Project 1", prompt: "Name and description", required: true, layout: "headline", slideOrder: 0 },
          { id: "project_1_link", type: "link", label: "Project 1 Link", prompt: "GitHub or live link", required: false, layout: "body", slideOrder: 1 },
          { id: "project_1_stars", type: "metric", label: "Stars", prompt: "GitHub stars", required: false, layout: "metric", slideOrder: 2 },
          { id: "project_2", type: "text", label: "Project 2", prompt: "Name and description", required: false, layout: "headline", slideOrder: 3 },
          { id: "project_2_link", type: "link", label: "Project 2 Link", prompt: "GitHub or live link", required: false, layout: "body", slideOrder: 4 },
        ]
      },
      {
        id: "looking_for", label: "Looking For", type: "custom",
        shared: false, visibility: "community",
        blocks: [
          { id: "open_to", type: "text", label: "Open To", prompt: "Job, collab, mentorship, etc.", required: true, layout: "headline", slideOrder: 0 },
          { id: "help_with", type: "text", label: "Can Help With", prompt: "What you can help others with", required: false, layout: "body", slideOrder: 1 },
          { id: "want_to_learn", type: "text", label: "Want to Learn", prompt: "What you want to learn", required: false, layout: "body", slideOrder: 2 },
        ]
      },
    ],
    sampleData: {
      name: "Taylor Kim",
      tagline: "Building open-source tools for AI developers",
      bio: "Staff engineer by day, OSS maintainer by night. I believe in tools that get out of your way.",
      github: "https://github.com/taylorkim",
      twitter: "https://twitter.com/taylorkim_dev",
      languages: "TypeScript, Rust, Python, Go",
      frameworks: "React, Next.js, tRPC, Prisma, FastAPI",
      interests: "Local-first software, AI agents, Developer experience",
      experience: "10",
      project_1: "VectorDB-JS: TypeScript client for vector databases",
      project_1_link: "https://github.com/taylorkim/vectordb-js",
      project_1_stars: "2,340",
      project_2: "AI-Shell: Natural language terminal commands",
      project_2_link: "https://github.com/taylorkim/ai-shell",
      open_to: "Open source collaborations, conference speaking",
      help_with: "TypeScript architecture, OSS project maintenance, Developer tooling",
      want_to_learn: "Rust internals, distributed systems, WebAssembly",
    },
    directory: {
      visibility: "public",
      cardFields: ["name", "tagline", "languages"],
      sortFields: ["name", "experience"],
      searchFields: ["name", "languages", "frameworks"],
      filters: { industry: false, skills: true, stage: false },
    },
  },
];

// Helper to get preset by ID
function getPresetById(id: string): CommunityPreset {
  return COMMUNITY_PRESETS.find(p => p.id === id) || COMMUNITY_PRESETS[0];
}

// Helper to get sample content for a block from preset
function getSampleContentFromPreset(preset: CommunityPreset, blockId: string, blockType: string): string {
  if (preset.sampleData[blockId] !== undefined) {
    return preset.sampleData[blockId];
  }

  const typeMap: Record<string, string> = {
    text: "Sample content for this field.",
    metric: "$10K",
    image: "",
    document: "document.pdf",
    embed: "",
    link: "https://example.com",
  };

  return typeMap[blockType] || "Sample content";
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WIZARD_STEPS: WizardStep[] = [
  { id: "welcome", num: 1, label: "Welcome" },
  { id: "appearance", num: 2, label: "Appearance" },
  { id: "rooms", num: 3, label: "Rooms" },
  { id: "directory", num: 4, label: "Directory" },
  { id: "launch", num: 5, label: "Launch" },
];

const ROOM_TYPES: { id: RoomSemantic; label: string }[] = [
  { id: "about", label: "Profile" },
  { id: "projects", label: "Project" },
  { id: "metrics", label: "Metrics" },
  { id: "timeline", label: "Timeline" },
  { id: "custom", label: "Custom" },
];

const BLOCK_TYPES = [
  { id: "text", label: "Text" },
  { id: "metric", label: "Metric" },
  { id: "image", label: "Image" },
  { id: "embed", label: "Embed" },
  { id: "document", label: "Document" },
  { id: "link", label: "Link" },
];

const DEFAULT_COMMUNITY_ROOMS: RoomTemplate[] = [
  {
    id: "identity", label: "Identity", type: "about",
    shared: false, visibility: "public",
    blocks: [
      { id: "name", type: "text", label: "Name", prompt: "Your full name", required: true, layout: "headline", slideOrder: 0 },
      { id: "bio", type: "text", label: "Bio", prompt: "Short bio", required: true, layout: "body", slideOrder: 1 },
      { id: "photo", type: "image", label: "Photo", prompt: "Profile photo", required: false, layout: "media", slideOrder: 2 },
    ]
  },
  {
    id: "startup", label: "Startup", type: "projects",
    shared: true, visibility: "community",
    blocks: [
      { id: "startup_name", type: "text", label: "Startup Name", prompt: "Company name", required: true, layout: "headline", slideOrder: 0 },
      { id: "one_liner", type: "text", label: "One-liner", prompt: "What you do in one sentence", required: true, layout: "body", slideOrder: 1 },
      { id: "stage", type: "text", label: "Stage", prompt: "Idea, MVP, Growth, etc.", required: true, layout: "metric", slideOrder: 2 },
    ]
  },
  {
    id: "pitch", label: "Pitch", type: "custom",
    shared: true, visibility: "public",
    blocks: [
      { id: "problem", type: "text", label: "Problem", prompt: "The problem you solve", required: true, layout: "headline", slideOrder: 1 },
      { id: "solution", type: "text", label: "Solution", prompt: "Your solution", required: true, layout: "body", slideOrder: 2 },
      { id: "market", type: "text", label: "Market", prompt: "Market size and opportunity", required: true, layout: "body", slideOrder: 3 },
      { id: "product", type: "embed", label: "Product Demo", prompt: "Loom or video demo", required: false, layout: "media", slideOrder: 4 },
      { id: "traction", type: "metric", label: "Traction", prompt: "Key metrics", required: true, layout: "metric", slideOrder: 5 },
      { id: "ask", type: "text", label: "Ask", prompt: "What you're raising", required: false, layout: "headline", slideOrder: 6 },
    ]
  },
  {
    id: "traction", label: "Traction", type: "metrics",
    shared: true, visibility: "private",
    blocks: [
      { id: "mrr", type: "metric", label: "MRR", prompt: "Monthly recurring revenue", required: false, layout: "metric", slideOrder: 1 },
      { id: "users", type: "metric", label: "Users", prompt: "Active users", required: false, layout: "metric", slideOrder: 2 },
      { id: "growth", type: "metric", label: "Growth Rate", prompt: "Month-over-month %", required: false, layout: "metric", slideOrder: 3 },
    ]
  },
  {
    id: "documents", label: "Documents", type: "custom",
    shared: true, visibility: "community",
    blocks: [
      { id: "deck", type: "document", label: "Pitch Deck", prompt: "Upload your deck", required: false, layout: "media", slideOrder: 0 },
      { id: "one_pager", type: "document", label: "One Pager", prompt: "Company one-pager", required: false, layout: "media", slideOrder: 1 },
    ]
  }
];

const MAX_ROOMS = 8;
const MAX_BLOCKS_PER_ROOM = 12;

const DEFAULT_CONFIG: CommunityConfig = {
  theme: "light",
  textSize: "M",
  density: "list",
  rooms: DEFAULT_COMMUNITY_ROOMS,
  directory: {
    visibility: "community",
    cardFields: ["name", "startup_name", "stage"],
    sortFields: ["name", "stage"],
    searchFields: ["name", "startup_name"],
    filters: { industry: true, skills: true, stage: true },
  },
};

// ── Sample Member Data (for preview) ──────────────────────────────────────────

const SAMPLE_MEMBER = {
  // Identity
  name: "Kwame Mensah",
  bio: "Founder building AI infrastructure for communities.",
  title: "Founder & CEO",
  location: "San Francisco",

  // Startup
  startup_name: "Artefact Labs",
  one_liner: "Infrastructure for founder communities.",
  stage: "Seed",

  // Pitch
  problem: "Accelerators track founders in spreadsheets.",
  solution: "Structured artefacts for portfolio management.",
  market: "$4B founder community tools market.",
  traction: "127 active communities",
  ask: "Raising $2M seed",

  // Metrics
  mrr: "$24K",
  users: "1,240",
  growth: "18%",

  // Documents
  deck: "pitch-deck.pdf",
  one_pager: "one-pager.pdf",
};

function getSampleContent(blockId: string, blockType: string, presetId?: string): string {
  // Use preset-specific sample data if preset is provided
  if (presetId) {
    const preset = getPresetById(presetId);
    return getSampleContentFromPreset(preset, blockId, blockType);
  }

  // Fallback to legacy SAMPLE_MEMBER for backwards compatibility
  const idMap: Record<string, string> = {
    name: SAMPLE_MEMBER.name,
    bio: SAMPLE_MEMBER.bio,
    photo: "",
    startup_name: SAMPLE_MEMBER.startup_name,
    one_liner: SAMPLE_MEMBER.one_liner,
    stage: SAMPLE_MEMBER.stage,
    problem: SAMPLE_MEMBER.problem,
    solution: SAMPLE_MEMBER.solution,
    market: SAMPLE_MEMBER.market,
    traction: SAMPLE_MEMBER.traction,
    ask: SAMPLE_MEMBER.ask,
    mrr: SAMPLE_MEMBER.mrr,
    users: SAMPLE_MEMBER.users,
    growth: SAMPLE_MEMBER.growth,
    deck: SAMPLE_MEMBER.deck,
    one_pager: SAMPLE_MEMBER.one_pager,
    product: "",
  };

  if (idMap[blockId] !== undefined) return idMap[blockId];

  const typeMap: Record<string, string> = {
    text: "Sample content for this field.",
    metric: "$10K",
    image: "",
    document: "document.pdf",
    embed: "",
    link: "https://example.com",
  };

  return typeMap[blockType] || "Sample content";
}

// ── Ghost Typing Hook ─────────────────────────────────────────────────────────

type TypingState = {
  [blockId: string]: {
    target: string;
    displayed: string;
    isTyping: boolean;
  };
};

function useGhostTyping(rooms: RoomTemplate[], presetId?: string) {
  const [typingState, setTypingState] = useState<TypingState>({});
  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Build target content map from rooms
  const targetMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const room of rooms) {
      for (const block of room.blocks) {
        map[block.id] = getSampleContent(block.id, block.type, presetId);
      }
    }
    return map;
  }, [rooms, presetId]);

  // Detect changes and start typing animations
  useEffect(() => {
    const newState: TypingState = {};
    const blocksToAnimate: string[] = [];

    for (const [blockId, target] of Object.entries(targetMap)) {
      const existing = typingState[blockId];
      if (!existing) {
        // New block - start typing
        newState[blockId] = { target, displayed: "", isTyping: true };
        blocksToAnimate.push(blockId);
      } else if (existing.target !== target) {
        // Content changed - restart typing
        newState[blockId] = { target, displayed: "", isTyping: true };
        blocksToAnimate.push(blockId);
      } else {
        // Keep existing state
        newState[blockId] = existing;
      }
    }

    if (blocksToAnimate.length > 0) {
      setTypingState(newState);

      // Clear old intervals for these blocks
      for (const blockId of blocksToAnimate) {
        const existing = intervalsRef.current.get(blockId);
        if (existing) clearInterval(existing);
      }

      // Start staggered typing for new blocks
      blocksToAnimate.forEach((blockId, idx) => {
        const delay = idx * 150; // Stagger by 150ms
        setTimeout(() => {
          const target = targetMap[blockId];
          if (!target) return;

          let charIdx = 0;
          const interval = setInterval(() => {
            charIdx++;
            setTypingState((prev) => {
              const current = prev[blockId];
              if (!current) return prev;
              if (charIdx >= target.length) {
                clearInterval(interval);
                intervalsRef.current.delete(blockId);
                return {
                  ...prev,
                  [blockId]: { ...current, displayed: target, isTyping: false },
                };
              }
              return {
                ...prev,
                [blockId]: { ...current, displayed: target.slice(0, charIdx) },
              };
            });
          }, 25); // 25ms per character

          intervalsRef.current.set(blockId, interval);
        }, delay);
      });
    }

    // Cleanup intervals on unmount
    return () => {
      intervalsRef.current.forEach((interval) => clearInterval(interval));
    };
  }, [targetMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get displayed content for a block
  const getDisplayedContent = useCallback(
    (blockId: string, fallback: string) => {
      const state = typingState[blockId];
      if (!state) return fallback;
      return state.displayed || (state.isTyping ? "" : fallback);
    },
    [typingState]
  );

  const isTyping = useCallback(
    (blockId: string) => typingState[blockId]?.isTyping ?? false,
    [typingState]
  );

  return { getDisplayedContent, isTyping };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  const C = useC();
  return (
    <motion.div
      onClick={() => onChange(!on)}
      animate={{ background: on ? "#4ade80" : C.edge }}
      transition={{ duration: 0.15 }}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: on ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
        style={{
          position: "absolute",
          top: 2,
          width: 16,
          height: 16,
          borderRadius: 8,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,.35)",
        }}
      />
    </motion.div>
  );
}

// ── Room Accordion ────────────────────────────────────────────────────────────

function RoomAccordion({
  room,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
}: {
  room: RoomTemplate;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<RoomTemplate>) => void;
  onRemove: () => void;
  onAddBlock: () => void;
  onUpdateBlock: (blockId: string, updates: Partial<BlockTemplate>) => void;
  onRemoveBlock: (blockId: string) => void;
}) {
  const C = useC();
  const VIS_COLORS: Record<string, string> = { public: C.green, community: C.blue, private: C.amber };

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Room Header */}
      <motion.div
        onClick={onToggleExpand}
        whileHover={{ background: C.edge }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          border: `1px solid ${isExpanded ? C.t3 : C.sep}`,
          borderRadius: isExpanded ? "8px 8px 0 0" : 8,
          cursor: "pointer",
          background: isExpanded ? C.edge : "transparent",
          transition: "border-color 0.15s",
        }}
      >
        <span style={{ flex: 1, fontSize: 13, color: C.t1, fontWeight: 500 }}>{room.label}</span>
        {room.shared && (
          <span style={{ fontSize: 9, color: C.t4, fontFamily: "'DM Mono', monospace" }}>shared</span>
        )}
        <span
          style={{
            fontSize: 8,
            color: VIS_COLORS[room.visibility],
            fontFamily: "'DM Mono', monospace",
            textTransform: "uppercase",
          }}
        >
          {room.visibility}
        </span>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          style={{ fontSize: 10, color: C.t4 }}
        >
          ▼
        </motion.span>
      </motion.div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              overflow: "hidden",
              border: `1px solid ${C.sep}`,
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
              background: C.bg,
            }}
          >
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Room Name */}
              <div>
                <Lbl style={{ display: "block", marginBottom: 6 }}>Room name</Lbl>
                <input
                  type="text"
                  value={room.label}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    border: `1px solid ${C.sep}`,
                    borderRadius: 6,
                    background: "transparent",
                    color: C.t1,
                    fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    outline: "none",
                  }}
                />
              </div>

              {/* Room Type */}
              <div>
                <Lbl style={{ display: "block", marginBottom: 6 }}>Room type</Lbl>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ROOM_TYPES.map((t) => (
                    <motion.button
                      key={t.id}
                      onClick={() => onUpdate({ type: t.id })}
                      animate={{
                        background: room.type === t.id ? C.edge : "transparent",
                        borderColor: room.type === t.id ? C.t3 : C.sep,
                      }}
                      style={{
                        padding: "5px 10px",
                        border: "1px solid",
                        borderRadius: 6,
                        fontSize: 11,
                        color: room.type === t.id ? C.t1 : C.t3,
                        cursor: "pointer",
                      }}
                    >
                      {t.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Layout Preset */}
              <div>
                <Lbl style={{ display: "block", marginBottom: 6 }}>Layout preset</Lbl>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(() => {
                    const template = getTemplateForRoom(room.id, room.type);
                    const presets = getPresetOptions(template.id);
                    const currentPreset = room.preset || template.defaultPreset;
                    return presets.map((p) => (
                      <motion.button
                        key={p.id}
                        onClick={() => onUpdate({ preset: p.id })}
                        animate={{
                          background: currentPreset === p.id ? C.edge : "transparent",
                          borderColor: currentPreset === p.id ? C.t3 : C.sep,
                        }}
                        style={{
                          padding: "5px 10px",
                          border: "1px solid",
                          borderRadius: 6,
                          fontSize: 11,
                          color: currentPreset === p.id ? C.t1 : C.t3,
                          cursor: "pointer",
                        }}
                      >
                        {p.label}
                      </motion.button>
                    ));
                  })()}
                </div>
              </div>

              {/* Shared + Visibility Row */}
              <div style={{ display: "flex", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Lbl>Shared room</Lbl>
                    <Toggle on={room.shared} onChange={(v) => onUpdate({ shared: v })} />
                  </div>
                  <div style={{ fontSize: 10, color: C.t4, marginTop: 4 }}>
                    Co-founders can edit
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <Lbl style={{ display: "block", marginBottom: 6 }}>Visibility</Lbl>
                  <div style={{ display: "flex", border: `1px solid ${C.sep}`, borderRadius: 6, overflow: "hidden" }}>
                    {(["public", "community", "private"] as const).map((v) => (
                      <motion.button
                        key={v}
                        onClick={() => onUpdate({ visibility: v })}
                        animate={{
                          background: room.visibility === v ? C.edge : "transparent",
                          color: room.visibility === v ? C.t1 : C.t4,
                        }}
                        style={{
                          flex: 1,
                          padding: "5px 8px",
                          fontSize: 9,
                          border: "none",
                          fontFamily: "'DM Mono', monospace",
                          cursor: "pointer",
                          textTransform: "uppercase",
                        }}
                      >
                        {v}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Blocks */}
              <div>
                <Lbl style={{ display: "block", marginBottom: 8 }}>
                  Blocks ({room.blocks.length}/{MAX_BLOCKS_PER_ROOM})
                </Lbl>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {room.blocks.map((block) => (
                    <div
                      key={block.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        border: `1px solid ${C.sep}`,
                        borderRadius: 6,
                        background: C.edge,
                      }}
                    >
                      <span style={{ flex: 1, fontSize: 11, color: C.t2 }}>{block.label}</span>
                      <span
                        className="mono"
                        style={{ fontSize: 8, color: C.t4, textTransform: "uppercase" }}
                      >
                        {block.type}
                      </span>
                      {block.required && (
                        <span style={{ fontSize: 8, color: C.amber, fontFamily: "'DM Mono', monospace" }}>
                          req
                        </span>
                      )}
                      <motion.button
                        onClick={() => onRemoveBlock(block.id)}
                        whileHover={{ opacity: 0.7 }}
                        style={{ fontSize: 12, color: C.t4, cursor: "pointer" }}
                      >
                        ×
                      </motion.button>
                    </div>
                  ))}
                  {room.blocks.length < MAX_BLOCKS_PER_ROOM && (
                    <motion.button
                      onClick={onAddBlock}
                      whileHover={{ borderColor: C.t3 }}
                      style={{
                        padding: "8px 12px",
                        border: `1px dashed ${C.sep}`,
                        borderRadius: 6,
                        fontSize: 11,
                        color: C.t3,
                        cursor: "pointer",
                        background: "transparent",
                        textAlign: "center",
                      }}
                    >
                      + Add block
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Remove Room */}
              <motion.button
                onClick={onRemove}
                whileHover={{ opacity: 0.7 }}
                style={{
                  alignSelf: "flex-start",
                  padding: "6px 12px",
                  border: `1px solid ${C.sep}`,
                  borderRadius: 6,
                  fontSize: 10,
                  color: C.t4,
                  cursor: "pointer",
                  background: "transparent",
                }}
              >
                Remove room
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Mock Context Provider for Preview ─────────────────────────────────────────

function MockGuestArtefactProvider({
  children,
  rooms,
  identity,
  focusedRoomId,
}: {
  children: ReactNode;
  rooms: StandaloneRoom[];
  identity: Identity;
  focusedRoomId?: string | null;
}) {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(rooms[0]?.id || null);

  // Sync with focused room from parent
  useEffect(() => {
    if (focusedRoomId !== undefined) {
      setActiveRoomId(focusedRoomId || rooms[0]?.id || null);
    }
  }, [focusedRoomId, rooms]);

  const state: GuestArtefactState = useMemo(
    () => ({
      sessionId: "preview",
      createdAt: "2024-01-01T00:00:00.000Z",
      identity,
      rooms,
    }),
    [identity, rooms]
  );

  const artefactState: ArtefactState = useMemo(
    () => ({
      id: "preview",
      sessionId: "preview",
      ownerId: null,
      slug: null,
      lifecycleState: "draft" as const,
      identity,
      rooms,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      version: 0,
    }),
    [identity, rooms]
  );

  const value: GuestArtefactContextValue = useMemo(
    () => ({
      state,
      isLoaded: true,
      activeRoomId,
      setActiveRoomId,
      artefactState,
      events: [],
      version: 0,
      lifecycleState: "draft" as const,
      updateIdentity: () => {},
      updateRoom: () => {},
      addRoom: () => "",
      removeRoom: () => {},
      reorderRooms: () => {},
      updateBlocks: () => {},
      addBlock: () => {},
      removeBlock: () => {},
      claim: () => {},
      publish: () => {},
      archive: () => {},
      getActiveRoom: () => rooms.find((r) => r.id === activeRoomId),
      getRoomBlockCount: () => rooms.reduce((acc, r) => acc + r.blocks.length, 0),
      clearState: () => {},
    }),
    [state, activeRoomId, artefactState, rooms]
  );

  return <GuestArtefactCtx.Provider value={value}>{children}</GuestArtefactCtx.Provider>;
}

// ── Artefact Preview using canonical artefact renderers ──────────────────────

function ArtefactPreviewInner({
  accent,
  cardBg,
  colorId,
  onColorChange,
  theme,
  dark,
  onToggleTheme,
  autoShowRoom,
  fullscreen,
}: {
  accent: string;
  cardBg: string;
  colorId: string;
  onColorChange: (id: string) => void;
  theme: ReturnType<typeof useCardColors>;
  dark: boolean;
  onToggleTheme: () => void;
  autoShowRoom?: boolean;
  fullscreen?: boolean;
}) {
  return (
    <div style={fullscreen ? { width: "100%", height: "100%", display: "flex", flexDirection: "column" } : { transform: "scale(0.65)", transformOrigin: "center center" }}>
      <ExpandedRenderer
        accent={accent}
        cardBg={cardBg}
        colorId={colorId}
        onColorChange={onColorChange}
        onCollapse={() => {}}
        theme={theme}
        dark={dark}
        onToggleTheme={onToggleTheme}
        autoShowRoom={autoShowRoom}
        fillContainer={fullscreen}
      />
    </div>
  );
}

function ArtefactPreview({
  config,
  showExpanded = false,
  focusedRoomId,
  fullscreen = false,
  presetId = "accelerator",
}: {
  config: CommunityConfig;
  showExpanded?: boolean;
  focusedRoomId?: string | null;
  fullscreen?: boolean;
  presetId?: string;
}) {
  const C = useC();
  const { dark, toggle: toggleTheme } = useTheme();
  const theme = useCardColors(C);
  const [colorId, setColorId] = useState(theme.isDark ? "indigo" : "magenta");

  const colorExists = theme.colors.some((c) => c.id === colorId);
  const effectiveColorId = colorExists ? colorId : theme.isDark ? "indigo" : "magenta";
  const cc = theme.colors.find((c) => c.id === effectiveColorId) || theme.colors[0];

  // Ghost typing effect
  const { getDisplayedContent } = useGhostTyping(config.rooms, presetId);

  // Convert RoomTemplate[] to StandaloneRoom[] for preview with sample content
  const mockRooms: StandaloneRoom[] = useMemo(() => {
    return config.rooms.map((room, idx) => ({
      id: room.id,
      key: room.id,
      label: room.label,
      prompt: "",
      visibility: room.visibility === "public" ? ("public" as const) : ("private" as const),
      orderIndex: idx,
      blocks: room.blocks.map((block, bIdx) => {
        const sampleContent = getSampleContent(block.id, block.type, presetId);
        const displayedContent = getDisplayedContent(block.id, sampleContent);
        return {
          id: block.id,
          blockType: (block.type === "text" || block.type === "image" || block.type === "link" ||
                     block.type === "embed" || block.type === "document" || block.type === "metric"
                     ? block.type : "text") as "text" | "image" | "link" | "embed" | "document" | "metric",
          content: displayedContent,
          orderIndex: bIdx,
        };
      }),
    }));
  }, [config.rooms, getDisplayedContent, presetId]);

  // Sample member identity - use preset-specific data
  const mockIdentity: Identity = useMemo(() => {
    const preset = getPresetById(presetId);
    return {
      name: preset.sampleData.name || SAMPLE_MEMBER.name,
      title: preset.sampleData.title || preset.sampleData.headline || SAMPLE_MEMBER.title,
      bio: preset.sampleData.bio || SAMPLE_MEMBER.bio,
      location: preset.sampleData.location || SAMPLE_MEMBER.location,
      skills: ["Product", "Engineering"],
      links: [],
    };
  }, [presetId]);

  if (showExpanded) {
    return (
      <MockGuestArtefactProvider rooms={mockRooms} identity={mockIdentity} focusedRoomId={focusedRoomId}>
        <ArtefactPreviewInner
          accent={cc.accent}
          cardBg={cc.card}
          colorId={colorId}
          onColorChange={setColorId}
          theme={theme}
          dark={dark}
          onToggleTheme={toggleTheme}
          autoShowRoom={!!focusedRoomId}
          fullscreen={fullscreen}
        />
      </MockGuestArtefactProvider>
    );
  }

  return (
    <CompactRenderer
      identity={mockIdentity}
      rooms={mockRooms}
      accent={cc.accent}
      cardBg={cc.card}
      onExpand={() => {}}
      onShowOutputs={() => {}}
      colorId={colorId}
      onColorChange={setColorId}
      theme={theme}
      dark={dark}
      onToggleTheme={toggleTheme}
    />
  );
}

// ── Main Wizard Component ─────────────────────────────────────────────────────

export function CommunityCreateWizard() {
  const C = useC();
  const { dark, toggle: toggleTheme } = useTheme();
  const router = useRouter();

  const [wizStep, setWizStep] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [launched, setLaunched] = useState(false);
  const [started, setStarted] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [communityName, setCommunityName] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<CommunityConfig>(DEFAULT_CONFIG);
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [previewViewMode, setPreviewViewMode] = useState<PreviewViewMode>("workspace");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("accelerator");

  // Apply a preset to the config
  const applyPreset = (presetId: string) => {
    const preset = getPresetById(presetId);
    setSelectedPresetId(presetId);
    setConfig(prev => ({
      ...prev,
      rooms: preset.rooms,
      directory: preset.directory,
    }));
  };

  const upd = (path: string, val: unknown) => {
    setConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as CommunityConfig;
      const parts = path.split(".");
      let obj: Record<string, unknown> = next;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]] as Record<string, unknown>;
      }
      obj[parts[parts.length - 1]] = val;
      return next;
    });
  };

  // ── Room Management ──────────────────────────────────────────────────────────

  const updateRoom = (roomId: string, updates: Partial<RoomTemplate>) => {
    setConfig((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === roomId ? { ...r, ...updates } : r)),
    }));
  };

  const addRoom = () => {
    if (config.rooms.length >= MAX_ROOMS) return;
    const newRoom: RoomTemplate = {
      id: `room_${Date.now()}`,
      label: "New Room",
      type: "custom",
      shared: false,
      visibility: "community",
      blocks: [],
    };
    setConfig((prev) => ({ ...prev, rooms: [...prev.rooms, newRoom] }));
    setExpandedRoomId(newRoom.id);
  };

  const removeRoom = (roomId: string) => {
    setConfig((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((r) => r.id !== roomId),
    }));
    if (expandedRoomId === roomId) setExpandedRoomId(null);
  };

  const addBlock = (roomId: string) => {
    const room = config.rooms.find((r) => r.id === roomId);
    if (!room || room.blocks.length >= MAX_BLOCKS_PER_ROOM) return;
    const newBlock: BlockTemplate = {
      id: `block_${Date.now()}`,
      type: "text",
      label: "New Block",
      prompt: "Enter content",
      required: false,
      layout: "body",
      slideOrder: room.blocks.length,
    };
    updateRoom(roomId, { blocks: [...room.blocks, newBlock] });
  };

  const updateBlock = (roomId: string, blockId: string, updates: Partial<BlockTemplate>) => {
    const room = config.rooms.find((r) => r.id === roomId);
    if (!room) return;
    updateRoom(roomId, {
      blocks: room.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
    });
  };

  const removeBlock = (roomId: string, blockId: string) => {
    const room = config.rooms.find((r) => r.id === roomId);
    if (!room) return;
    updateRoom(roomId, { blocks: room.blocks.filter((b) => b.id !== blockId) });
  };

  // ── Navigation ───────────────────────────────────────────────────────────────

  const advance = () => {
    if (wizStep === 0 && !started) {
      setDone((d) => new Set([...d, WIZARD_STEPS[0].id]));
      setStarted(true);
      setWizStep(1);
      return;
    }
    setDone((d) => new Set([...d, WIZARD_STEPS[wizStep].id]));
    if (wizStep < WIZARD_STEPS.length - 1) {
      setWizStep((w) => w + 1);
    } else {
      setLaunched(true);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Launched State ──────────────────────────────────────────────────────────

  if (launched) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={FADE}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 20,
          textAlign: "center",
          padding: 40,
        }}
      >
        {/* Community logo */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: logo ? "transparent" : C.edge,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            border: `1px solid ${C.sep}`,
            marginBottom: 4,
          }}
        >
          {logo ? (
            <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 20, color: C.green, fontWeight: 600 }}>✓</span>
          )}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: C.t1, letterSpacing: "-.025em" }}>
            {communityName || "Your community"} is ready
          </div>
          <div style={{ fontSize: 13, color: C.t3, maxWidth: 360, lineHeight: 1.7, marginTop: 8 }}>
            Members will receive artefacts structured exactly as you configured.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <motion.button
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "9px 20px",
              border: `1px solid ${C.t2}`,
              borderRadius: 8,
              background: "transparent",
              color: C.t1,
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: ".04em",
              cursor: "pointer",
            }}
          >
            Invite members
          </motion.button>
          <motion.button
            whileHover={{ opacity: 0.8 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/community/test/dashboard")}
            style={{
              padding: "9px 20px",
              border: `1px solid ${C.sep}`,
              borderRadius: 8,
              background: "transparent",
              color: C.t3,
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: ".04em",
              cursor: "pointer",
            }}
          >
            Open dashboard
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // ── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, overflow: "hidden", position: "relative", minHeight: 0 }}>
      {/* PHASE 1: Fullscreen welcome */}
      <motion.div
        key="welcome-phase"
        animate={{
          opacity: started ? 0 : 1,
          x: started ? -60 : 0,
          pointerEvents: started ? "none" : "auto",
        }}
        transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "auto",
          willChange: "transform, opacity",
          background: `linear-gradient(180deg, ${C.bg} 0%, ${dark ? "rgba(30,30,35,1)" : "rgba(250,250,252,1)"} 100%)`,
        }}
      >
        {/* Minimal branded header */}
        <div
          style={{
            width: "100%",
            padding: "20px 32px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: logo ? "transparent" : `linear-gradient(135deg, ${C.blue}40 0%, ${C.blue}20 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              border: `1px solid ${C.sep}`,
            }}
          >
            {logo ? (
              <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 10, color: C.blue, fontWeight: 600 }}>C</span>
            )}
          </div>
          <span style={{ fontSize: 11, color: C.t3, fontFamily: "'DM Sans', sans-serif" }}>
            {communityName || "New Community"}
          </span>
        </div>

        {/* Main welcome content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px 80px" }}>
          <div style={{ width: "100%", maxWidth: 420 }}>
            {/* Hero section */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleLogoUpload}
                />
                <motion.div
                  onClick={() => logoRef.current?.click()}
                  whileHover={{ scale: 1.02, borderColor: C.t3 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 16,
                    background: logo ? "transparent" : `linear-gradient(135deg, ${C.blue}15 0%, ${C.blue}05 100%)`,
                    border: `2px dashed ${logo ? C.t3 : C.sep}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    cursor: "pointer",
                    overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}
                >
                  {logo ? (
                    <img src={logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 24, color: C.t4 }}>+</span>
                  )}
                </motion.div>
                {logo && (
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); setLogo(null); }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      fontSize: 10,
                      color: C.t4,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      marginBottom: 8,
                      fontFamily: "'DM Mono', monospace",
                    }}
                  >
                    remove logo
                  </motion.button>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div style={{ fontSize: 11, color: C.t4, marginBottom: 8, fontFamily: "'DM Mono', monospace", letterSpacing: ".04em", textTransform: "uppercase" }}>
                  Launch your
                </div>
                <input
                  type="text"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder="Community Name"
                  style={{
                    width: "100%",
                    maxWidth: 280,
                    fontSize: 24,
                    fontWeight: 600,
                    color: C.t1,
                    background: "transparent",
                    border: "none",
                    borderBottom: `1px solid ${communityName ? "transparent" : C.sep}`,
                    textAlign: "center",
                    outline: "none",
                    padding: "8px 0",
                    fontFamily: "'DM Sans', sans-serif",
                    letterSpacing: "-.025em",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderBottomColor = C.t3}
                  onBlur={(e) => e.target.style.borderBottomColor = communityName ? "transparent" : C.sep}
                />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{ fontSize: 13, color: C.t3, marginTop: 16, lineHeight: 1.7, maxWidth: 320, margin: "16px auto 0" }}
              >
                Design how founders present themselves in your community.
              </motion.p>
            </div>

            {/* Steps preview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{
                background: C.edge,
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 24,
                border: `1px solid ${C.sep}`,
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {WIZARD_STEPS.slice(1).map((s, idx) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      opacity: 0.7,
                    }}
                  >
                    <span style={{ fontSize: 9, color: C.t4, fontFamily: "'DM Mono', monospace" }}>{idx + 1}</span>
                    <span style={{ fontSize: 11, color: C.t2 }}>{s.label}</span>
                    {idx < WIZARD_STEPS.length - 2 && (
                      <span style={{ color: C.sep, marginLeft: 6 }}>·</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              style={{ textAlign: "center" }}
            >
              <motion.button
                onClick={advance}
                whileHover={{ opacity: 0.9, y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: "12px 32px",
                  background: `linear-gradient(135deg, ${C.t1} 0%, ${dark ? "#555" : "#333"} 100%)`,
                  border: "none",
                  borderRadius: 10,
                  color: C.bg,
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.12)",
                }}
              >
                Start setup
                <span style={{ fontSize: 14, opacity: 0.8 }}>→</span>
              </motion.button>
              <div style={{ fontSize: 10, color: C.t4, marginTop: 12, fontFamily: "'DM Mono', monospace" }}>
                Takes about 2 minutes
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* PHASE 2: Split layout */}
      <motion.div
        key="split-phase"
        animate={{
          opacity: started ? 1 : 0,
          x: started ? 0 : 60,
          pointerEvents: started ? "auto" : "none",
        }}
        transition={{ duration: 0.42, ease: [0.22, 0.1, 0.36, 1], delay: started ? 0.12 : 0 }}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          overflow: "hidden",
          willChange: "transform, opacity",
        }}
      >
        {/* LEFT panel */}
        <motion.div
          animate={{ x: started ? 0 : -40, opacity: started ? 1 : 0 }}
          transition={{ duration: 0.44, ease: [0.22, 0.1, 0.36, 1], delay: started ? 0.18 : 0 }}
          style={{
            width: 440,
            flexShrink: 0,
            borderRight: `1px solid ${C.sep}`,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Branded header */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: `1px solid ${C.sep}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 5,
                background: logo ? "transparent" : C.edge,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: `1px solid ${C.sep}`,
                flexShrink: 0,
              }}
            >
              {logo ? (
                <img src={logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 9, color: C.t3, fontWeight: 600 }}>C</span>
              )}
            </div>
            <span style={{ fontSize: 12, color: C.t1, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
              {communityName || "New Community"}
            </span>
          </div>

          <div style={{ padding: "24px 32px 80px", flex: 1, overflow: "auto" }}>
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 11,
                color: C.t4,
                marginBottom: 4,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: ".04em",
                textTransform: "uppercase",
              }}
            >
              Setup
            </div>
            <div style={{ fontSize: 13, color: C.t2, lineHeight: 1.6 }}>
              Configure your workspace.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {WIZARD_STEPS.map((s, idx) => {
              const isDone = done.has(s.id);
              const isCurrent = wizStep === idx;
              const isPast = idx < wizStep;

              return (
                <div key={s.id}>
                  <motion.div
                    onClick={() => {
                      if (isPast || isDone) setWizStep(idx);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      cursor: isPast || isDone ? "pointer" : "default",
                    }}
                  >
                    <motion.div
                      animate={{
                        background:
                          isDone || isPast ? C.t1 : isCurrent ? C.t1 : "transparent",
                        borderColor:
                          isDone || isPast ? C.t1 : isCurrent ? C.t1 : C.sep,
                      }}
                      transition={{ duration: 0.18 }}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        border: "1.5px solid",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isDone || isPast ? (
                        <span style={{ fontSize: 11, color: C.bg, fontWeight: 700, lineHeight: 1 }}>
                          ✓
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 9,
                            color: isCurrent ? C.bg : C.t4,
                            fontFamily: "'DM Mono', monospace",
                            fontWeight: 600,
                          }}
                        >
                          {s.num}
                        </span>
                      )}
                    </motion.div>

                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isCurrent ? 500 : 400,
                        color: isCurrent ? C.t1 : isDone || isPast ? C.t2 : C.t3,
                        transition: "color .15s",
                      }}
                    >
                      {s.label}
                    </span>
                  </motion.div>

                  <AnimatePresence>
                    {isCurrent && (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 0.1, 0.36, 1] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ paddingLeft: 34, paddingBottom: 16 }}>
                          {/* Step content */}
                          {s.id === "welcome" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              <Lbl style={{ display: "block" }}>Community Type</Lbl>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(2, 1fr)",
                                  gap: 8,
                                }}
                              >
                                {COMMUNITY_PRESETS.map((preset) => (
                                  <motion.button
                                    key={preset.id}
                                    onClick={() => applyPreset(preset.id)}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    animate={{
                                      borderColor: selectedPresetId === preset.id ? C.blue : C.sep,
                                      background: selectedPresetId === preset.id ? `${C.blue}08` : "transparent",
                                    }}
                                    style={{
                                      padding: "10px 12px",
                                      border: `1.5px solid ${C.sep}`,
                                      borderRadius: 8,
                                      background: "transparent",
                                      textAlign: "left",
                                      cursor: "pointer",
                                      position: "relative",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: selectedPresetId === preset.id ? C.t1 : C.t2,
                                        marginBottom: 2,
                                      }}
                                    >
                                      {preset.label}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 10,
                                        color: C.t4,
                                        lineHeight: 1.4,
                                      }}
                                    >
                                      {preset.description}
                                    </div>
                                    {selectedPresetId === preset.id && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        style={{
                                          position: "absolute",
                                          top: 6,
                                          right: 6,
                                          width: 6,
                                          height: 6,
                                          borderRadius: "50%",
                                          background: C.blue,
                                        }}
                                      />
                                    )}
                                  </motion.button>
                                ))}
                              </div>
                              <div style={{ fontSize: 10, color: C.t4, marginTop: 4 }}>
                                {COMMUNITY_PRESETS.find(p => p.id === selectedPresetId)?.rooms.length || 0} rooms pre-configured with example content
                              </div>
                            </div>
                          )}

                          {s.id === "appearance" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                  <Lbl style={{ display: "block" }}>Dark mode</Lbl>
                                  <div style={{ fontSize: 10, color: C.t4, marginTop: 2 }}>
                                    {dark ? "Dark theme" : "Light theme"}
                                  </div>
                                </div>
                                <Toggle
                                  on={dark}
                                  onChange={() => toggleTheme()}
                                />
                              </div>
                              <div>
                                <Lbl style={{ display: "block", marginBottom: 8 }}>Text size</Lbl>
                                <div
                                  style={{
                                    display: "flex",
                                    border: `1px solid ${C.sep}`,
                                    borderRadius: 7,
                                    overflow: "hidden",
                                    width: "fit-content",
                                  }}
                                >
                                  {(["S", "M", "L"] as const).map((sz) => (
                                    <motion.button
                                      key={sz}
                                      onClick={() => upd("textSize", sz)}
                                      animate={{
                                        background: config.textSize === sz ? C.edge : "transparent",
                                        color: config.textSize === sz ? C.t1 : C.t3,
                                      }}
                                      style={{
                                        padding: "6px 16px",
                                        fontSize: 11,
                                        border: "none",
                                        fontFamily: "'DM Sans', sans-serif",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {sz}
                                    </motion.button>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Lbl style={{ display: "block", marginBottom: 8 }}>
                                  Layout density
                                </Lbl>
                                <div
                                  style={{
                                    display: "flex",
                                    border: `1px solid ${C.sep}`,
                                    borderRadius: 7,
                                    overflow: "hidden",
                                    width: "fit-content",
                                  }}
                                >
                                  {(["List", "Compact"] as const).map((d) => (
                                    <motion.button
                                      key={d}
                                      onClick={() => upd("density", d.toLowerCase())}
                                      animate={{
                                        background:
                                          config.density === d.toLowerCase()
                                            ? C.edge
                                            : "transparent",
                                        color:
                                          config.density === d.toLowerCase() ? C.t1 : C.t3,
                                      }}
                                      style={{
                                        padding: "6px 16px",
                                        fontSize: 11,
                                        border: "none",
                                        fontFamily: "'DM Sans', sans-serif",
                                        cursor: "pointer",
                                      }}
                                    >
                                      {d}
                                    </motion.button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {s.id === "rooms" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                              <div style={{ fontSize: 11, color: C.t3, marginBottom: 12, lineHeight: 1.6 }}>
                                Define the structure of member artefacts. Click a room to configure.
                              </div>
                              {config.rooms.map((room) => (
                                <RoomAccordion
                                  key={room.id}
                                  room={room}
                                  isExpanded={expandedRoomId === room.id}
                                  onToggleExpand={() =>
                                    setExpandedRoomId(expandedRoomId === room.id ? null : room.id)
                                  }
                                  onUpdate={(updates) => updateRoom(room.id, updates)}
                                  onRemove={() => removeRoom(room.id)}
                                  onAddBlock={() => addBlock(room.id)}
                                  onUpdateBlock={(blockId, updates) =>
                                    updateBlock(room.id, blockId, updates)
                                  }
                                  onRemoveBlock={(blockId) => removeBlock(room.id, blockId)}
                                />
                              ))}
                              {config.rooms.length < MAX_ROOMS && (
                                <motion.button
                                  onClick={addRoom}
                                  whileHover={{ borderColor: C.t3 }}
                                  style={{
                                    marginTop: 8,
                                    padding: "10px 14px",
                                    border: `1px dashed ${C.sep}`,
                                    borderRadius: 8,
                                    fontSize: 12,
                                    color: C.t3,
                                    cursor: "pointer",
                                    background: "transparent",
                                    textAlign: "center",
                                  }}
                                >
                                  + Add room ({config.rooms.length}/{MAX_ROOMS})
                                </motion.button>
                              )}
                            </div>
                          )}

                          {s.id === "directory" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                              <div>
                                <Lbl style={{ display: "block", marginBottom: 8 }}>
                                  Directory visibility
                                </Lbl>
                                <div
                                  style={{
                                    display: "flex",
                                    border: `1px solid ${C.sep}`,
                                    borderRadius: 7,
                                    overflow: "hidden",
                                    width: "fit-content",
                                  }}
                                >
                                  {(["public", "community"] as const).map((v) => (
                                    <motion.button
                                      key={v}
                                      onClick={() => upd("directory.visibility", v)}
                                      animate={{
                                        background:
                                          config.directory.visibility === v ? C.edge : "transparent",
                                        color: config.directory.visibility === v ? C.t1 : C.t3,
                                      }}
                                      style={{
                                        padding: "6px 14px",
                                        fontSize: 11,
                                        border: "none",
                                        fontFamily: "'DM Sans', sans-serif",
                                        cursor: "pointer",
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {v === "community" ? "Community only" : "Public"}
                                    </motion.button>
                                  ))}
                                </div>
                              </div>
                              <div style={{ fontSize: 11, color: C.t3, marginTop: 8, lineHeight: 1.6 }}>
                                Use AI search to find and filter members with natural language queries.
                              </div>
                            </div>
                          )}

                          {s.id === "launch" && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {[...done].map((id) => {
                                const st = WIZARD_STEPS.find((s) => s.id === id);
                                return st ? (
                                  <div
                                    key={id}
                                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                                  >
                                    <span style={{ color: C.t1, fontSize: 10 }}>✓</span>
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: C.t3,
                                        fontFamily: "'DM Sans', sans-serif",
                                      }}
                                    >
                                      {st.label}
                                    </span>
                                  </div>
                                ) : null;
                              })}
                              <div
                                style={{
                                  marginTop: 8,
                                  fontSize: 12,
                                  color: C.t2,
                                  lineHeight: 1.65,
                                }}
                              >
                                Your community workspace is ready. Members will receive artefacts
                                based on this structure.
                              </div>
                            </div>
                          )}

                          <motion.button
                            onClick={advance}
                            whileHover={{ opacity: 0.8 }}
                            whileTap={{ scale: 0.97 }}
                            style={{
                              marginTop: 16,
                              padding: "9px 22px",
                              border: `1px solid ${C.t2}`,
                              borderRadius: 8,
                              background: "transparent",
                              color: C.t1,
                              fontSize: 11,
                              fontFamily: "'DM Mono', monospace",
                              letterSpacing: ".04em",
                              cursor: "pointer",
                            }}
                          >
                            {s.id === "launch" ? "Launch community →" : "Continue →"}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {idx < WIZARD_STEPS.length - 1 && (
                    <div
                      style={{
                        marginLeft: 10,
                        width: 1,
                        height: isCurrent ? 0 : 12,
                        background: C.sep,
                        transition: "height .2s",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          </div>
        </motion.div>

        {/* RIGHT panel - Artefact Preview using existing CompactCard */}
        <motion.div
          animate={{
            x: started ? 0 : 50,
            opacity: started ? 1 : 0,
          }}
          transition={{ duration: 0.44, ease: [0.22, 0.1, 0.36, 1], delay: started ? 0.22 : 0 }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: (wizStep === 2 && expandedRoomId) || wizStep === 3 ? "stretch" : "center",
            justifyContent: (wizStep === 2 && expandedRoomId) || wizStep === 3 ? "stretch" : "center",
            background: C.bg,
            overflow: "hidden",
            position: "relative",
            transition: "align-items 0.28s ease, justify-content 0.28s ease",
          }}
        >
          <AnimatePresence>
            {!(wizStep === 2 && expandedRoomId) && wizStep !== 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "absolute",
                  width: 300,
                  height: 300,
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${C.blue}08 0%, transparent 70%)`,
                  pointerEvents: "none",
                }}
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {wizStep === 2 && expandedRoomId ? (
              <motion.div
                key="fullscreen-preview"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.28, ease: [0.22, 0.1, 0.36, 1] }}
                style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: 24 }}
              >
                {/* View Toggle */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <ViewToggle mode={previewViewMode} onChange={setPreviewViewMode} />
                </div>

                <AnimatePresence mode="wait">
                  {previewViewMode === "page" ? (
                    <motion.div
                      key="page-view"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.28, ease: [0.22, 0.1, 0.36, 1] }}
                      style={{ flex: 1, overflow: "auto", borderRadius: 12, border: `1px solid ${C.sep}` }}
                    >
                      <PageComposer
                        rooms={config.rooms}
                        getBlockContent={(blockId: string) => {
                          for (const room of config.rooms) {
                            const block = room.blocks.find((b) => b.id === blockId);
                            if (block) {
                              return getSampleContent(block.id, block.type, selectedPresetId);
                            }
                          }
                          return "";
                        }}
                        accent={C.blue}
                        activeRoomId={expandedRoomId}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="workspace-view"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.28, ease: [0.22, 0.1, 0.36, 1] }}
                      style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
                    >
                      <ArtefactPreview
                        config={config}
                        showExpanded={true}
                        focusedRoomId={expandedRoomId}
                        fullscreen={true}
                        presetId={selectedPresetId}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : wizStep === 3 ? (
              <motion.div
                key="directory-preview"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.28, ease: [0.22, 0.1, 0.36, 1] }}
                style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, padding: 24 }}
              >
                <motion.span
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  className="mono"
                  style={{
                    fontSize: 8,
                    color: C.t4,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    marginBottom: 12,
                    textAlign: "center",
                  }}
                >
                  directory preview
                </motion.span>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <MemberDirectoryPreview />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="compact-preview"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.22, 0.1, 0.36, 1] }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <motion.span
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  className="mono"
                  style={{
                    fontSize: 8,
                    color: C.t4,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  member artefact preview
                </motion.span>

                <motion.div
                  key={JSON.stringify(config.rooms) + wizStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 0.1, 0.36, 1] }}
                >
                  <ArtefactPreview
                    config={config}
                    showExpanded={wizStep === 2}
                    focusedRoomId={null}
                    presetId={selectedPresetId}
                  />
                </motion.div>

                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  style={{ fontSize: 11, color: C.t4, lineHeight: 1.6 }}
                >
                  Updates live as you configure each step.
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
