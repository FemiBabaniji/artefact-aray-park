# Data Infrastructure
## Artefact Platform — Creative Incubator

---

## Overview

The platform's data model is built around a single invariant: **the artefact is the system's source of truth**. Every view — queue, portal, paths, community — is a projection of the same underlying object. The artefact does not change shape between contexts. Only the communication plane changes.

All current state is represented as plain JavaScript objects in the prototype. This document specifies the full data model, entity relationships, status machines, and the production schema implied by the current implementation.

---

## Core Entities

### 1. Member Identity (`AVA` / `MEMBERS`)

The identity object represents who a person is, independent of where they are in the program.

```ts
type Member = {
  id:           string              // e.g. "am", "mc"
  name:         string
  initials:     string              // derived: first letters of name
  title:        string              // discipline / role
  email:        string
  phone:        string | null
  location:     string
  availability: string | null
  color:        string              // visual identity hex, stable per member
  avatarUrl:    string | null       // uploaded photo, base64 in prototype
  stage:        Stage               // current lifecycle position
  risk:         boolean             // derived flag, surfaced by system
  sections:     number              // total checkpoint count (always 7)
  accepted:     number              // accepted section count, derived
}
```

**Extended profile fields** (present on the primary member object `AVA`, not on cohort members):

```ts
type MemberProfile = Member & {
  practice:     string              // practice statement body
  focus:        string              // current focus narrative
  influences:   string[]            // named influences
  projects:     ProjectGroup[]      // grouped works
  skills:       SkillMap            // categorised skill tags
  goals:        string[]            // program goals list
}

type ProjectGroup = {
  name:  string                     // series name
  works: { title: string; year: string }[]
}

type SkillMap = {
  Primary:  string[]
  Tools:    string[]
  Mediums:  string[]
}
```

---

### 2. Section (`INIT`)

A section is a typed, stateful unit of the artefact. It is the atomic object that accumulates meaning over time. Sections are not notes — the type carries semantic weight, the content is the instance.

```ts
type Section = {
  id:         SectionKey            // stable identifier
  label:      string                // human-readable name
  status:     SectionStatus         // current lifecycle state
  evidence:   string                // member-authored content (pulled from workspace)
  cp:         1 | 2                 // checkpoint gate this section belongs to
  feedback:   string | undefined    // mentor note
  feedbackAt: string | undefined    // date of last feedback (e.g. "Feb 28")
  feedbackBy: string | undefined    // mentor id (implied, not yet in prototype)
}

type SectionKey =
  | "practice"      // Practice Statement    — cp:1
  | "focus"         // Current Focus         — cp:1
  | "material"      // Material Sourcing Plan — cp:1
  | "influences"    // Influences & Context  — cp:1
  | "series"        // Project Series        — cp:2
  | "exhibition"    // Exhibition Goals      — cp:2
  | "collab"        // Collaboration Outreach — cp:2
```

**Checkpoint gates:** sections are grouped into two gates. Checkpoint 1 (sections 1–4) must be completed before Checkpoint 2 (sections 5–7) unlocks in production.

---

### 3. Section Status Machine

Status is the most critical type in the system. Every view derives meaning from it.

```
empty → in_progress → submitted → reviewed → accepted
                                ↘ in_progress  (revise action)
```

| Status | Who Sets It | Meaning |
|---|---|---|
| `empty` | system (default) | Section untouched |
| `in_progress` | member (auto on workspace open) | Member is working |
| `submitted` | member (pull action) | Ready for review |
| `reviewed` | mentor | Seen, feedback left, not yet accepted |
| `accepted` | mentor | Complete, counts toward checkpoint |

**Token mapping** (drives all visual output):

```ts
const STATUS_TOKENS = {
  empty:       { dot: sep,    label: "empty",       color: t3 },
  in_progress: { dot: amber,  label: "in progress", color: amber },
  submitted:   { dot: blue,   label: "submitted",   color: blue },
  reviewed:    { dot: "#d97706", label: "reviewed", color: "#d97706" },
  accepted:    { dot: green,  label: "accepted",    color: green },
}
```

---

### 4. Artefact

The artefact is the aggregate object — identity + sections + workspace content. It is the thing that persists across every stage of the lifecycle.

```ts
type Artefact = {
  memberId:   string
  sections:   Section[]             // always 7, keyed by SectionKey
  wsContent:  string                // rich HTML from contentEditable workspace
  updatedAt:  string                // ISO timestamp
}
```

The artefact is **rendered differently by role**, not stored differently:

| Role | What they see | Edit capability |
|---|---|---|
| `member` | Full artefact + workspace | Can edit workspace, pull to sections |
| `mentor` | Full artefact + review panel | Can add feedback, change section status |
| `admin` | Full artefact (read-only) | Can advance stage, see all metadata |

This is enforced via the `role` prop on `<Artefact>`. The data is the same. The communication plane is different.

---

### 5. Stage (`STAGES` / `STAGE_ORDER`)

Stage is the member's current position in the program lifecycle.

```ts
type Stage =
  | "pending"      // Applied, awaiting admin decision
  | "entry"        // Accepted, beginning program
  | "foundation"   // Checkpoint 1 work
  | "development"  // Checkpoint 2 work
  | "showcase"     // Preparing final presentation
  | "graduate"     // Program complete

const STAGE_ORDER: Stage[] = [
  "pending", "entry", "foundation", "development", "showcase", "graduate"
]
```

Each stage has a visual identity token:

```ts
type StageToken = {
  id:    Stage
  label: string
  color: string   // tinted background hex for cards and pills
}
```

Stage is **always derived** from section progress in the production model. In the prototype it is stored directly on the member for display purposes. In production: stage = the highest gate for which all required sections are accepted.

---

### 6. Program (`PROGRAM`)

The program is the configuration object that governs the artefact's checkpoint structure. Different programs can require different sections and different gates.

```ts
type Program = {
  name:        string
  subtitle:    string
  week:        number               // current week (1-indexed)
  totalWeeks:  number
  live:        boolean
}
```

In production this extends to:

```ts
type ProgramConfig = Program & {
  id:           string
  checkpoints:  CheckpointConfig[]
}

type CheckpointConfig = {
  gate:             Stage           // which stage this unlocks
  requiredSections: SectionKey[]    // must all be "accepted"
  deadline:         string | null
}
```

---

### 7. Application Queue Entry

Each entry in the review queue is a projection of a member's artefact with an additional decision status:

```ts
type QueueEntry = {
  id:       string
  name:     string
  title:    string
  initials: string
  color:    string
  date:     string                  // submission date
  imgSrc:   string | null           // avatar photo
  sections: Section[]               // artefact snapshot at time of application
  status:   DecisionStatus
}

type DecisionStatus = "pending" | "reviewed" | "accepted" | "declined"
```

The queue entry is **not a separate record** — it is the same artefact rendered in admin-review context, with a `status` overlay for the decision workflow.

---

### 8. Identity (Walkthrough / Application)

The identity object is the pre-artefact state — what an applicant fills out before their artefact is initiated. It persists to `localStorage` in the prototype so it flows across all 6 walkthrough steps.

```ts
type Identity = {
  name:     string
  title:    string
  location: string
  email:    string
  practice: string    // becomes the "practice" section's initial evidence
  goals:    string    // becomes the "exhibition" / "collab" seed
}
```

**Production note:** `localStorage` is the prototype's persistence layer for the demo. In production, identity becomes the member record, and the artefact is initiated as a server-side object the moment the application is submitted. The walkthrough's `setIdentity` wrapper — which writes to localStorage on every update — maps directly to an `updateMember` mutation call.

---

### 9. Walkthrough Steps (`STEPS`)

The walkthrough is a meta-layer that documents the system's own data lifecycle. Each step corresponds to a real production route.

```ts
type WalkthroughStep = {
  id:    StepId
  num:   number
  label: string
  title: string
  desc:  string        // narrative description of what this step demonstrates
}

type StepId = "apply" | "portfolio" | "queue" | "paths" | "accepted" | "community"
```

| Step | Route (production) | Data context |
|---|---|---|
| `apply` | `/apply` | Identity creation, artefact initiation |
| `portfolio` | `/[memberId]` | Artefact in member context, compact onboarding |
| `queue` | `/admin/queue` | Artefact in review context, decision overlay |
| `paths` | `/admin/paths` | Sections as checkpoint matrix, stage distribution |
| `accepted` | `/portal` | Artefact in portal context, workspace live |
| `community` | `/admin/community` | Artefacts in aggregate, risk surfaced |

---

## Derived Values

The following are never stored — always computed on read:

| Value | Derivation |
|---|---|
| `accepted` count | `sections.filter(s => s.status === "accepted").length` |
| `pct` progress | `Math.round((accepted / sections.length) * 100)` |
| `risk` flag | `accepted < 3 && daysSinceActivity > 10` |
| `stage` (production) | highest gate where all required sections are `accepted` |
| checkpoint progress | `sections.filter(s => s.cp === N && s.status === "accepted").length` |
| queue pending count | `apps.filter(a => statuses[a.id] === "pending").length` |
| stage distribution | `STAGE_ORDER.map(s => members.filter(m => m.stage === s).length)` |

---

## State Flow Diagram

```
Identity (localStorage)
        │
        ▼
  [ Apply Step ]
  fields: name, title, location,
          email, practice, goals
        │
        │ submit → artefact initiated
        ▼
  [ Artefact Object ]
  sections: 7 × { id, status, evidence, cp, feedback }
  wsContent: ""
  stage: "pending"
        │
        │ admin reviews queue
        ▼
  [ Queue Entry ]
  same artefact + decisionStatus overlay
  admin: accept → stage "entry"
        │
        │ accepted
        ▼
  [ Member Portal ]
  member writes in workspace
  member pulls content to sections
  mentor leaves feedback
  sections: empty → in_progress → submitted → reviewed → accepted
        │
        │ cp1 sections all accepted → stage "foundation"
        │ cp2 sections all accepted → stage "development"
        ▼
  [ Paths / Checkpoint Matrix ]
  all members × all sections = coloured dot grid
  stage distribution cards
        │
        │ program complete
        ▼
  [ Community View ]
  artefacts in aggregate
  risk flagged automatically
  cohort stats derived
```

---

## Theme & Visual Tokens

The design system has two complete token sets that adapt all data-driven colour output:

```ts
// Status colours are derived from theme tokens, not hardcoded
// This means the same section status renders correctly in light + dark

type ThemeTokens = {
  void:  string    // page background
  edge:  string    // card borders
  sep:   string    // hairline separators
  t1:    string    // headings
  t2:    string    // body
  t3:    string    // meta / labels
  t4:    string    // muted / placeholders
  blue:  string    // submitted status
  green: string    // accepted status
  amber: string    // in_progress / reviewed status
}
```

All status dots, progress bars, risk indicators, and stage pills derive their colour from these tokens. Swapping `DARK` → `LIGHT` cascades through every data visualisation automatically.

---

## Production Schema (Postgres)

The production tables implied by this data model:

```sql
-- Program configuration
programs (
  id, name, subtitle, total_weeks, current_week, live, created_at
)

-- Cohorts within a program
cohorts (
  id, program_id, name, start_date, end_date
)

-- Members
members (
  id, cohort_id, mentor_id,
  name, initials, title, email, phone, location, availability,
  avatar_url, color, stage, risk,
  created_at, updated_at
)

-- Extended member profile
member_profiles (
  id, member_id,
  practice, focus, goals jsonb,
  influences jsonb, skills jsonb
)

-- Projects and works
projects (
  id, member_id, series_name, display_order
)
works (
  id, project_id, title, year
)

-- Artefact (1:1 with member)
artefacts (
  id, member_id, ws_content text, updated_at
)

-- Sections (rows, not JSON — queryable by status)
sections (
  id, artefact_id, section_key, label,
  status, evidence text, cp int,
  feedback text, feedback_at, feedback_by,
  updated_at
)

-- Stage transition log (immutable, append-only)
stage_transitions (
  id, member_id,
  from_stage, to_stage,
  triggered_by, triggered_by_id,
  note text, created_at
)

-- Application queue decisions
application_decisions (
  id, member_id, decided_by,
  decision, note text, decided_at
)

-- Program checkpoint configuration
program_checkpoints (
  id, program_id,
  gate_stage, required_sections jsonb,
  deadline
)
```

**Key constraint:** sections are rows, not a JSON column. This enables queries like:

```sql
-- All members with accepted practice statement
SELECT m.* FROM members m
JOIN artefacts a ON a.member_id = m.id
JOIN sections s ON s.artefact_id = a.id
WHERE s.section_key = 'practice' AND s.status = 'accepted';

-- At-risk detection
SELECT m.id, m.name,
  COUNT(s.id) FILTER (WHERE s.status = 'accepted') AS accepted_count,
  MAX(s.updated_at) AS last_activity
FROM members m
JOIN artefacts a ON a.member_id = m.id
JOIN sections s ON s.artefact_id = a.id
WHERE m.cohort_id = $1
GROUP BY m.id
HAVING COUNT(s.id) FILTER (WHERE s.status = 'accepted') < 3
   AND MAX(s.updated_at) < NOW() - INTERVAL '10 days';
```

---

## The Invariant

Every design decision in this data model holds one principle:

> **The artefact is the source of truth. Everything else is a view.**

The queue is a view. The paths matrix is a view. The community dashboard is a view. The compact identity card is a view. None of them store anything that isn't already in the artefact. When a mentor accepts a section, one row changes. Every view that depends on that section — the artefact, the queue, the paths matrix, the member's progress bar — updates from the same change.

This is why the walkthrough works as a product demo: it is not showing six different screens. It is showing one object, accumulated over time, from six different vantage points.

---

## The Central Claim

The artefact is a data object that is also a communication plane. Not a data object that gets translated into a UI. Not a record that gets contextualised for different audiences. The object itself is the communication. When a member sees their artefact, when a mentor reviews it, when an admin evaluates it in the queue — they are all looking at the same object. No translation layer. No contextualisation step. One object, read directly, in place.

This is what makes the prototype unusual. Most systems store data and then build separate views on top of it — a member dashboard, an admin panel, a mentor review screen, each with its own layout and its own logic for what to surface. This system has one component, `<Artefact>`, that appears in every context. The data it holds is the communication.

The proof is in the code.

---

## The Single Component Across All Planes

### Member plane — `role="mentee"`

```jsx
// MenteeView — step 2 (portfolio) and step 5 (accepted)
<Artefact
  sections={sections}
  setSections={setSections}
  syncing={syncing}
  avatarSrc={avatarSrc}
  onAvatarChange={setAvatarSrc}
  compact={compact}
  onToggleCompact={()=>setCompact(false)}
  role="mentee"
/>
```

The member sees their artefact in full. Sections are interactive. Mentor feedback is rendered inline on each section row — visible only when `role==="mentee"` and `s.feedback` exists. The workspace sits beside it when `showWorkspace={true}`.

### Mentor plane — `role="mentor"`

```jsx
// MentorView — right panel, read-only reference at 72% scale
<div style={{pointerEvents:"none", opacity:.75, transform:"scale(0.72)"}}>
  <Artefact
    sections={sections}
    setSections={setSections}
    syncing={false}
    avatarSrc={avatarSrc}
    onAvatarChange={()=>{}}
    compact={false}
    onToggleCompact={()=>{}}
    role="mentor"
  />
</div>
```

The mentor sees the same artefact as a reference panel. `pointerEvents:none` makes it inert. The mentor's actions happen in `MentorPanel` on the left, which writes back to the same `sections` state the artefact is reading. The artefact reflects those changes in real time because it is reading from the same source.

### Admin queue plane — `role="admin"`

```jsx
// StepQueue — right panel when an applicant card is selected
<div style={{pointerEvents:"none", userSelect:"none"}}>
  <Artefact
    sections={sel.sections}
    setSections={()=>{}}
    syncing={false}
    avatarSrc={null}
    onAvatarChange={()=>{}}
    compact={false}
    onToggleCompact={()=>{}}
    role="admin"
  />
</div>
```

`setSections={()=>{}}` — a no-op. The artefact cannot be changed from this context. The admin's decision surface is the queue list on the left. The artefact is the evidence on the right. Same component, same structure, zero editability.

### What actually changes across all three

One prop: `role`. Two conditionals in the component body:

```jsx
// Workspace side: mentor gets review panel, member gets editor
{role === "mentor"
  ? <MentorPanel sections={sections} setSections={setSections}/>
  : <WsExpanded wsContent={wsContent} ... />
}

// Section rows: feedback only visible to the person it was written for
{role === "mentee" && s.feedback && (
  <div style={{fontStyle:"italic", borderLeft:`2px solid ${C.sep}`}}>
    {s.feedback}
    {s.feedbackAt && <span className="mono">{s.feedbackAt}</span>}
  </div>
)}
```

That is the entire contextualisation layer. Two conditionals. Everything else — the identity widget, the section dots, the drill panels, the status colours, the evidence text — is identical across all three roles. There is no translation happening. The object speaks directly to whoever is reading it.

---

## The Identity Widget as Instantiation

The identity widget — the compact card — is not a view built on top of the member record. It is what gets instantiated when a member is created. The data fields exist to populate the widget. The widget is the object.

```jsx
// The compact card inside Artefact when compact===true
<motion.div style={{border:`1px solid ${C.edge}`, borderRadius:14, width:300}}>
  <div style={{borderBottom:`1px solid ${C.sep}`, padding:"10px 14px",
    display:"flex", justifyContent:"space-between"}}>
    <Lbl style={{fontSize:8}}>input_001</Lbl>
    <Btn onClick={onToggleCompact}>⊞ expand</Btn>
  </div>
  <Avatar size={44} imgSrc={avatarSrc} onImgChange={onAvatarChange}/>
  <div>{AVA.name}</div>
  <div>{AVA.title}</div>
  <HR/>
  <div>{AVA.email}</div>
  <div>{AVA.phone}</div>
  <div>{AVA.location}</div>
</motion.div>
```

This exact structure — `input_001` label, avatar, name, title, hairline, contact — appears in the queue list for every applicant. The queue does not use a custom list row design. It uses the identity widget's DNA:

```jsx
// StepQueue — each applicant card carries the same structure
<motion.div style={{border:`1px solid ${C.edge}`, borderRadius:14, padding:"12px 14px"}}>

  {/* same header pattern */}
  <div style={{borderBottom:`1px solid ${C.sep}`, display:"flex", justifyContent:"space-between"}}>
    <Lbl>input_00{i+1}</Lbl>
    <div style={{width:6, height:6, borderRadius:"50%", background:ST[statuses[a.id]].dot}}/>
  </div>

  {/* same identity body */}
  <Avatar size={36} imgSrc={a.imgSrc||null} color={a.color}/>
  <div>{a.name}</div>
  <div>{a.title}</div>
  <HR/>

  {/* section dots — artefact sections compressed to 5×5px */}
  <div style={{display:"flex", gap:3, flexWrap:"wrap"}}>
    {a.sections.map(s => (
      <motion.div animate={{background:ST[s.status].dot}}
        style={{width:5, height:5, borderRadius:1}}/>
    ))}
  </div>

  {/* accepted count + date */}
  <div>{a.sections.filter(s=>s.status==="accepted").length}/{a.sections.length} accepted</div>
  <div className="mono">{a.date}</div>

</motion.div>
```

An admin reading the queue is reading the same object they would see if they clicked through to the full artefact. The widget communicates what the object is before any explanation is needed. The `borderRadius:14`, the `input_001` header, the hairline separator, the section dot grid — all carried over from the compact card. Same language, different level of detail.

The `input_001` label is the most explicit statement of this. It is not a tracking reference. It is the system saying: this is an instance of the identity object type, numbered in sequence. It was created. It persists.

---

## The Data Object

### `INIT` — the artefact's content layer

```js
const INIT = [
  { id:"practice",   label:"Practice Statement",    status:"accepted",
    evidence:"I build environments that hold a feeling…",
    cp:1,
    feedback:"Strong opening. The light-as-material framing is distinctive. Consider adding one concrete example.",
    feedbackAt:"Feb 28" },

  { id:"focus",      label:"Current Focus",          status:"submitted",
    evidence:"Bioluminescent systems + civic space", cp:1 },

  { id:"material",   label:"Material Sourcing Plan", status:"in_progress",
    evidence:"", cp:1 },

  { id:"influences", label:"Influences & Context",   status:"accepted",
    evidence:"Turrell, Eliasson, Hamilton",
    cp:1,
    feedback:"Good range. Could you add one less-obvious influence to show independent thinking?",
    feedbackAt:"Mar 1" },

  { id:"series",     label:"Project Series",          status:"in_progress",
    evidence:"", cp:2 },

  { id:"exhibition", label:"Exhibition Goals",        status:"empty",
    evidence:"", cp:2 },

  { id:"collab",     label:"Collaboration Outreach",  status:"empty",
    evidence:"", cp:2 },
];
```

Seven sections. Each has a `status` that drives every dot in every view. An `evidence` string the member wrote. A `cp` gate that determines when this section must be complete. And optionally `feedback` and `feedbackAt` — the mentor's note, rendered inside the artefact only when `role==="mentee"`.

The `id` field is the semantic type. `"practice"` always means practice statement. Not a label for display — a contract. The system can query `sections.find(s => s.id === "practice")` from any context and know what it's reading.

### `AVA` — the identity layer

```js
const AVA = {
  name:"Ava Martinez",
  title:"Visual Artist & Spatial Designer",
  email:"ava@avamartinez.studio",
  location:"Toronto, ON",
  phone:"+1 416 555 0192",
  availability:"open to residencies & commissions",
  practice:"I build environments that hold a feeling…",
  focus:"Currently developing a new body of work around bioluminescent systems…",
  influences:["James Turrell","Olafur Eliasson","Ann Hamilton","Rirkrit Tiravanija"],
  projects:[
    { name:"Threshold Studies", works:[
        {title:"Liminal I", year:"2025"},
        {title:"Liminal II", year:"2025"},
        {title:"Passage Membrane", year:"2024"}
    ]},
    { name:"Memory Architectures", works:[
        {title:"Residue", year:"2024"},
        {title:"Palimpsest", year:"2023"},
        {title:"Soft Infrastructure", year:"2023"}
    ]},
  ],
  skills:{
    Primary:["Environmental Design","Light Sculpture","Spatial Narrative"],
    Tools:["Rhino 3D","TouchDesigner","QLab"],
    Mediums:["Light","Glass","Resin","Sound"]
  },
  goals:["International exhibition presence","Bioluminescent materials research","Urban planner collaborations"],
};
```

The identity layer. In the compact card: name, title, contact. In the full artefact drill panels: practice, works, skills, connect. In the queue card: initials avatar and name. In the paths matrix row: initials only. Same data, read at whatever level of detail the context allows. No transformation between contexts — the component reads the fields it needs and renders them.

### `MEMBERS` — the program layer

```js
const MEMBERS = [
  { id:"am", name:"Ava Martinez",    stage:"foundation",  risk:false, sections:7, accepted:4, color:"#3b4f42" },
  { id:"mc", name:"Marcus Chen",     stage:"development", risk:false, sections:7, accepted:6, color:"#2e3d52" },
  { id:"er", name:"Elena Rodriguez", stage:"foundation",  risk:true,  sections:7, accepted:2, color:"#4a3d5a" },
  { id:"jo", name:"James Okonkwo",   stage:"showcase",    risk:false, sections:7, accepted:7, color:"#52432e" },
  { id:"mp", name:"Maya Patel",      stage:"graduate",    risk:false, sections:7, accepted:7, color:"#2e4a3d" },
  { id:"dk", name:"David Kim",       stage:"pending",     risk:false, sections:7, accepted:0, color:"#2e3a52" },
];
```

The program layer: where each artefact is in the lifecycle. `stage` is derived from section acceptance in production but stored directly in the prototype. `accepted` is a cached count. `color` is stable — assigned once, it never changes because it is part of the identity widget's visual contract, not a status indicator.

The paths matrix, the community grid, the stage distribution cards, and the admin pipeline board are all projections of this layer combined with the sections data.

---

## Status Tokens — The Translation That Isn't

The only "translation" in the system is `mkST(C)` — a pure function that converts a theme to status colours:

```js
function mkST(C) {
  return {
    empty:       { dot:C.sep,      label:"empty",       color:C.t3     },
    in_progress: { dot:C.amber,    label:"in progress", color:C.amber  },
    submitted:   { dot:C.blue,     label:"submitted",   color:C.blue   },
    reviewed:    { dot:"#d97706",  label:"reviewed",    color:"#d97706" },
    accepted:    { dot:C.green,    label:"accepted",    color:C.green  },
  }
}
```

This function runs in `WsCompact`, `StepQueue`, `StepPaths`, and inside `Artefact`. The same `status` string on the same section produces the same colour in every view because every view calls the same function. There is no per-view colour mapping. There is no contextual reinterpretation of what `"accepted"` means. The token is the communication. The function converts it to a pixel once, everywhere.

---

## The Walkthrough as Proof

The six steps are not screens. They are the same data at six moments in its lifecycle, observed from six vantage points.

```js
const STEPS = [
  { id:"apply",     desc:"Birth of the artefact — identity, practice, goals captured in one object." },
  { id:"portfolio", desc:"The application becomes a live artefact. Same object, now interactive." },
  { id:"queue",     desc:"Same data object, different lens — read-only, decision surface." },
  { id:"paths",     desc:"Section statuses determine position. Same sections, aggregate view." },
  { id:"accepted",  desc:"The artefact in portal context. Member continues building." },
  { id:"community", desc:"All artefacts in aggregate. Risk surfaced automatically." },
];
```

"Same data object, different lens" is in the step descriptions because it is literally what the code does. `StepQueue` passes `sel.sections` to `<Artefact role="admin"/>`. `MenteeView` on step 5 passes the same `sections` state to `<Artefact role="mentee"/>`. The shape is identical. The role is the lens.

The identity typed in the Apply form flows through `localStorage` into the Portfolio artefact, into the Queue card's `identity.name`, into the Paths matrix row, into the Accepted portal, into the Community grid card. One object, six readings, no translation between any of them.

---

## What This Means for Production

One endpoint, one shape, three roles:

```
GET /members/:id/artefact
→ { memberId, sections, wsContent, updatedAt }
```

The queue view calls this and renders `<Artefact role="admin"/>`.
The portal calls this and renders `<Artefact role="mentee"/>`.
The mentor panel calls this and renders `<Artefact role="mentor"/>`.

The server does not contextualise the response for the caller. It does not build a view. It returns the object. The component receives it. The `role` prop is the only configuration needed to make it the right communication plane for the person reading it.

No translation. No contextualisation. The data object is the communication plane.

---

## The Pull Mechanism — How Content Enters the Artefact

The workspace and the artefact are deliberately separate layers. The workspace is private and formless — a `contentEditable` div where the member writes freely. The artefact is structured and typed — seven sections with statuses that the mentor reads. Content does not flow automatically between them. The member makes an editorial decision to pull.

### The suggest engine

When the member clicks `↙ pull`, the workspace content is read and passed through `suggest()`:

```js
const suggest = useCallback((content) => {
  const text = content.toLowerCase().replace(/<[^>]+>/g, "");
  const kw = {
    material:    ["material","biolum","resin","glass"],
    focus:       ["focus","developing","research"],
    practice:    ["practice","build","environment","light"],
    series:      ["liminal","threshold","series","project"],
    exhibition:  ["exhibition","show","gallery"],
    collab:      ["collaboration","outreach","partner"],
    influences:  ["turrell","eliasson","influence"],
  };
  let best = null, bs = 0;
  for (const [id, ks] of Object.entries(kw)) {
    const sc = ks.filter(k => text.includes(k)).length;
    if (sc > bs) { bs = sc; best = id; }
  }
  return best ? sections.find(s => s.id === best && s.status !== "accepted") : null;
}, [sections]);
```

The function strips HTML tags, lowercases the content, and scores each section ID against a keyword list. The highest-scoring non-accepted section is the suggestion. If Ava writes about "bioluminescent materials and resin sourcing," the function scores `material` highest and pre-selects it in the pull modal.

### The PullModal

```jsx
function PullModal({ sections, suggested, onConfirm, onDismiss }) {
  const [sel, setSel] = useState(suggested?.id || sections.find(s => s.status !== "accepted")?.id);
  const avail = sections.filter(s => s.status !== "accepted");

  return (
    <motion.div style={{position:"absolute", inset:0, backdropFilter:"blur(6px)"}}>
      <div style={{width:320}}>
        <div>
          {suggested
            ? <><span style={{color:C.green}}>{suggested.label}</span>{" — suggested."}</>
            : "Choose a section."
          }
        </div>
        {avail.map(s => (
          <button onClick={() => setSel(s.id)}>
            <span>{s.label}</span>
            <Dot status={s.status}/>
          </button>
        ))}
        <Btn onClick={onDismiss}>cancel</Btn>
        <Btn onClick={() => onConfirm(sel)} accent={C.green}>confirm →</Btn>
      </div>
    </motion.div>
  );
}
```

The modal shows all non-accepted sections with their current status dots. The suggested section is highlighted in green. The member can override the suggestion and pick any section. This is the only moment in the entire system where the member makes an explicit editorial choice about what is ready — the `confirm →` button is the act of saying "this content belongs in this section."

### The confirmPull function — where the state change happens

```js
const confirmPull = (sid) => {
  setShowPull(false);
  setPulling(true);
  setSyncing(true);

  const txt = (eRef.current?.innerHTML || wsContent)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);

  clearTimeout(syncT.current);
  syncT.current = setTimeout(() => {
    setSections(prev => prev.map(s =>
      s.id === sid
        ? { ...s, status: "submitted", evidence: txt || s.evidence }
        : s
    ));
    setPulling(false);
    setSyncing(false);
  }, 2800);
};
```

Four things happen in sequence:

1. `setPulling(true)` — shows the `Loader` component above the workspace, a visual indicator that something is in flight
2. `setSyncing(true)` — propagates up to the artefact, turns the border blue, shows "pulling…" in the workspace header
3. After 2800ms, `setSections` fires — the target section's `status` becomes `"submitted"` and its `evidence` is set to the stripped, trimmed, 140-character extract of the workspace content
4. `setPulling(false)` and `setSyncing(false)` — the visual indicators clear

The 2800ms delay is the prototype simulating a network write. In production this is a `PATCH /members/:id/sections/:sectionId` call that writes `{ status: "submitted", evidence: txt }` to the database. The `syncing` state represents that call being in flight.

### What the section looks like after a pull

Before pull:
```js
{ id: "material", status: "in_progress", evidence: "", cp: 1 }
```

After pull:
```js
{ id: "material", status: "submitted", evidence: "Bioluminescent systems and resin sourcing for the civic installation series", cp: 1 }
```

The section is now in the mentor's queue. The dot in every view that reads this section turns blue.

---

## The Feedback Loop — The Full Cycle

The pull mechanism delivers content to the mentor. The feedback loop returns a response to the member. Together they form the complete interaction cycle the system exists to enable.

### Step 1 — Member pulls, section enters the mentor's queue

`MentorPanel` filters sections by status on every render:

```js
const queue = sections.filter(s => s.status === "submitted");
const done  = sections.filter(s => ["reviewed", "accepted"].includes(s.status));
```

When Ava pulls her `material` section, it immediately appears in `queue` inside `MentorPanel`. The mentor sees the section label, the blue `submitted` dot, and the first two lines of evidence text. Nothing else needs to happen — the queue updates because it reads from the same `sections` state.

### Step 2 — Mentor opens the section, reads evidence, writes feedback

```js
const openSection = (id) => {
  setActive(id);
  setDraft(sections.find(s => s.id === id)?.feedback || "");
};
```

`openSection` sets `active` to the section ID and seeds `draft` with any existing feedback (so a mentor revising their own note sees what they wrote before). The inline review editor appears below the queue item.

### Step 3 — Mentor makes a decision

```js
const MENTOR_ACTIONS = [
  { status: "reviewed",    label: "reviewed", color: "#d97706" },
  { status: "accepted",    label: "accept",   color: "#16a34a" },
  { status: "in_progress", label: "revise",   color: "#f59e0b" },
];

const save = (newStatus) => {
  setSaving(true);
  setTimeout(() => {
    setSections(prev => prev.map(s => s.id === active
      ? {
          ...s,
          status:     newStatus,
          feedback:   draft.trim(),
          feedbackAt: new Date().toLocaleDateString("en-US", { month:"short", day:"numeric" }),
        }
      : s
    ));
    setSaving(false);
    setActive(null);
    setDraft("");
  }, 600);
};
```

Three possible decisions, each writing a different `status` back to the section:

- `"reviewed"` — seen, feedback left, judgment withheld. The dot turns darker amber. The section leaves the queue but is not yet accepted.
- `"accepted"` — complete. The dot turns green. The section counts toward the checkpoint gate. It can no longer be pulled to or reviewed (filtered out as `status !== "accepted"`).
- `"in_progress"` — revise. The dot returns to amber. The section goes back to the member as a work-in-progress with a note. It can be pulled again.

The `feedbackAt` timestamp is set to today's date on every save, so the member always sees when the feedback arrived.

### Step 4 — Member sees feedback inline in the artefact

```jsx
// Inside Artefact, in the sections list
{role === "mentee" && s.feedback && (
  <div style={{
    fontSize: 11, color: C.t3, lineHeight: 1.55,
    marginTop: 5, padding: "6px 10px",
    borderLeft: `2px solid ${C.sep}`,
    fontStyle: "italic"
  }}>
    {s.feedback}
    {s.feedbackAt && (
      <span className="mono" style={{fontSize:8, color:C.t4, marginLeft:8, fontStyle:"normal"}}>
        {s.feedbackAt}
      </span>
    )}
  </div>
)}
```

The feedback appears as an indented italic quote below the section row, only when `role==="mentee"`. The mentor who wrote it doesn't see it rendered back to them — they already know what they wrote. The member sees it as something that arrived from outside, with the date it arrived.

This is the complete feedback loop. Member writes → pulls to section → mentor reads and responds → member reads response inline → member revises in workspace → pulls again → loop continues until `"accepted"`.

### The pre-seeded feedback in `INIT`

```js
{ id:"practice", status:"accepted",
  evidence:"I build environments that hold a feeling…",
  feedback:"Strong opening. The light-as-material framing is distinctive. Consider adding one concrete example of a past work that embodies this.",
  feedbackAt:"Feb 28" },

{ id:"influences", status:"accepted",
  evidence:"Turrell, Eliasson, Hamilton",
  feedback:"Good range. Could you add one less-obvious influence to show independent thinking?",
  feedbackAt:"Mar 1" },
```

These two sections arrive in the prototype already carrying mentor feedback, even though their status is `"accepted"`. This is intentional — it shows that accepted sections can still carry notes. The feedback is not erased when a section is accepted. It remains as a record of the conversation that led to the acceptance.

---

## The `syncing` State — What It Represents

`syncing` is a boolean that threads through the entire component tree:

```
App state: const [syncing, setSyncing] = useState(false)
    ↓ passed as prop to
MenteeView → WsBox → WsExpanded (sets it via setSyncing)
    ↓ also passed to
Artefact (reads it, applies visual changes)
Mini (reads it, tints the logo blue)
```

`syncing` is set to `true` at the start of `confirmPull` and back to `false` 2800ms later when the section update resolves. During that window:

```jsx
// WsBox — border turns blue while syncing
<motion.div animate={{borderColor: syncing ? C.blue+"55" : C.sep}}>

// WsExpanded header — shows "pulling…" label
{syncing && <Lbl style={{color:C.blue}}>pulling…</Lbl>}

// Artefact — border pulses blue
syncBorder={syncing ? C.blue+"33" : C.sep}

// Mini — the geometric SVG logo tints blue
// (mini artefact shown when workspace is expanded)
```

In production, `syncing` maps directly to a network request being in flight. The 2800ms timeout is replaced by an async mutation:

```ts
const { mutate, isLoading } = useSectionMutation(memberId)
// isLoading === true while the PATCH request is pending
// isLoading === false when it resolves or errors
```

`syncing` in the prototype is `isLoading` from React Query in production. The visual behaviour — blue border, "pulling…" label, logo tint — is the UI communicating that the artefact and the server are momentarily out of sync. Once the mutation resolves, the border returns to `C.sep` and the label disappears.

---

## Checkpoint Gate Logic

Every section has a `cp` field: either `1` or `2`. This is the gate assignment.

```
cp:1 sections (Foundation gate):
  practice    → Practice Statement
  focus       → Current Focus
  material    → Material Sourcing Plan
  influences  → Influences & Context

cp:2 sections (Development gate):
  series      → Project Series
  exhibition  → Exhibition Goals
  collab      → Collaboration Outreach
```

The rule: all `cp:1` sections must be `"accepted"` before a member can reach the `foundation` stage. All `cp:2` sections must be `"accepted"` before the `development` stage.

The prototype doesn't enforce this gate — it renders stage as a stored value and lets the admin change it freely. The gate logic lives implicitly in the checkpoint matrix in `StepPaths`, where the section columns are ordered `cp:1` left, `cp:2` right, and a member's stage label visually aligns with how far their accepted dots extend.

In production the gate is enforced in `CheckpointService.validateTransition()`:

```ts
function validateTransition(member: Member, toStage: Stage): { ok: boolean; reason?: string } {
  const requiredForGate = program.checkpoints.find(c => c.gate === toStage)?.requiredSections ?? []
  const allAccepted = requiredForGate.every(key =>
    member.artefact.sections.find(s => s.id === key)?.status === "accepted"
  )
  if (!allAccepted) {
    return { ok: false, reason: `Not all required sections accepted for ${toStage}` }
  }
  return { ok: true }
}
```

This runs before every `advanceStage` call. An admin cannot advance a member to `foundation` unless `practice`, `focus`, `material`, and `influences` are all accepted. The UI can surface this — the advance button in the admin detail panel can be disabled with a tooltip showing which sections are still pending.

---

## The Queue Simulation — What the APPS Distribution Shows

`StepQueue` seeds four applicants with deliberately different section states:

```js
const APPS = [
  { id:"ava",  name:identity.name,     // Ava — carries the live sections state
    sections: sections },

  { id:"mc",   name:"Marcus Chen",     // strong applicant — most sections accepted
    sections: sections.map(s => ({
      ...s,
      status: ["practice","focus","influences"].includes(s.id) ? "accepted" : "in_progress"
    })) },

  { id:"er",   name:"Elena Rodriguez", // weak applicant — only practice submitted
    sections: sections.map(s => ({
      ...s,
      status: s.id === "practice" ? "submitted" : "empty"
    })) },

  { id:"jo",   name:"James Okonkwo",   // complete — everything accepted
    sections: sections.map(s => ({ ...s, status: "accepted" })) },
];
```

This is not arbitrary. The four states represent the realistic distribution an admin sees in an actual review queue:

- **Ava** — the live artefact, whatever state the user has left it in after the Portfolio step. This is the prototype's continuity — the object built in step 2 appears in step 3.
- **Marcus** — a strong application with solid cp:1 progress but cp:2 still in progress. The dot grid shows four greens and three ambers.
- **Elena** — a sparse application. One blue dot (practice submitted), six empty. The admin can see at a glance this applicant needs more work before a decision can be made.
- **James** — a complete application. Seven green dots. The admin's easiest decision.

When the admin clicks a card, the right panel shows `<Artefact sections={sel.sections} role="admin"/>`. Elena's artefact opens with six empty section panels and one submitted section. James's artefact opens with all seven sections accepted. The same component communicates the difference entirely through the data — no special layout for "sparse application" vs "complete application." The structure is identical. The content is what changes.

---

## The Graduate State and the Community View

`"graduate"` is the final stage in `STAGE_ORDER`. In the prototype, Maya Patel is the only graduate — `accepted:7`, all sections complete, `stage:"graduate"`.

In `StepCommunity`, the stat card calculations exclude graduates from the `active` count:

```js
const active = members.filter(m => !["pending", "graduate"].includes(m.stage)).length;
```

Pending members haven't started. Graduates are done. `active` is everyone in between — the members currently working through the program. The "4 active" stat card shows this count; it is the denominator for program health.

The average progress calculation does include graduates:

```js
const avgPct = Math.round(
  members.reduce((a, m) => a + (m.accepted / m.sections), 0) / members.length * 100
);
```

Maya's `7/7 = 100%` pulls the cohort average up. This is correct — a graduate's completion is part of the program's aggregate record. Their artefact persists. It becomes the benchmark for what a completed artefact looks like in this program.

In production, a graduated member's artefact becomes read-only. Their identity widget appears in the community grid with the `graduate` stage label and a full green progress bar. The artefact can be accessed as an archived reference — by mentors learning what "complete" looks like, by future cohorts as examples, by admins building program retrospectives.

David Kim is `"pending"` with `accepted:0`. He applied but hasn't been admitted. His card appears in the community grid with no progress and no stage colour. He is visible to admins in both the queue (`StepQueue`) and the community view (`StepCommunity`) — the same member object, same data, read in two different aggregate contexts.

---

## The Compact/Expanded State Machine — One Object, Two Presentations

### The state

The artefact has one boolean that governs its entire presentation: `compact`. It lives in `App` state, not inside the `Artefact` component.

```js
// App root
const [compact, setCompact] = useState(true)  // starts collapsed

// passed down through MenteeView into Artefact
<Artefact
  compact={compact}
  onToggleCompact={() => setCompact(false)}
  ...
/>
```

`compact` starts as `true`. The artefact renders as a 300px card. The member expands it. `compact` becomes `false`. The artefact renders as `min(70vw, 70vh)` — a full working surface. These are not two components. They are two rendering branches of the same component, reading the same `sections`, the same `avatarSrc`, the same `AVA` identity object. The data does not change. The presentation does.

This is the entire point. The object is stable. The UI is aware of what state it is in.

### The compact branch — the identity widget

```jsx
if (compact) {
  return (
    <motion.div
      layout
      initial={{ opacity:0, scale:.97 }}
      animate={{ opacity:1, scale:1, borderColor: syncing ? C.blue+"44" : C.edge }}
      exit={{ opacity:0, scale:.97 }}
      transition={SP}   // mass:4, stiffness:420, damping:52
      style={{ border:`1px solid ${C.edge}`, borderRadius:14, width:300 }}
    >
      {/* header: input_001 label + ⊞ qr + ⊞ expand */}
      {/* body: avatar, name, title, hairline, email, phone, location */}
      {/* OR: QR code view — cross-fades on showQR toggle */}
    </motion.div>
  );
}
```

The compact card is a 300px container with two internal views that cross-fade via `AnimatePresence mode="wait"`:

- **Identity view** — avatar, name, title, hairline separator, email, phone, location, availability status dot
- **QR view** — 148px QR code encoding the full vCard, member name, "scan to save contact" caption

The QR toggle lives inside the compact card because the compact card *is* the shareable object. It is what you hand someone at a networking event. The QR code is just the NFC/scan equivalent of the card — same data, different delivery mechanism.

The `SP` spring on the compact card (`mass:4, stiffness:420, damping:52`) gives the card physical weight when it appears. It snaps into place. It doesn't slide or fade — it lands. This is intentional. The card is not a UI transition. It is an object arriving.

### The expanded branch — the working surface

```jsx
return (
  <div style={{ position:"relative", width:"min(70vw,70vh)", height:"min(70vw,70vh)" }}>

    {/* floating label above the card */}
    <div style={{ position:"absolute", top:-18, left:0 }}>
      <Lbl>input_001</Lbl>
      <span>{AVA.name} — {AVA.title}</span>
    </div>

    <motion.div
      animate={{ borderColor: syncing ? C.blue+"44" : C.edge }}
      style={{ width:"100%", height:"100%", border:`1px solid ${C.edge}`,
        borderRadius:14, display:"grid", gridTemplateColumns:"1fr 1fr" }}
    >
      {/* LEFT: identity region + sections region */}
      {/* RIGHT: practice region + connect region */}
      {/* OVERLAY: DrillView when drilled !== null */}
    </motion.div>

  </div>
);
```

The expanded artefact is a square — `min(70vw, 70vh)` — a deliberate proportional choice. It fills the available space without overflowing. It looks the same on a laptop and a large monitor. The two-column grid divides it into four regions, each of which can be expanded by clicking.

The `input_001` label floats above the card at `top:-18`. It is not inside the card. It annotates the object from outside — the label is the system speaking, not the card speaking about itself.

### The transition between compact and expanded

When `compact` flips from `true` to `false`, `AnimatePresence mode="wait"` in `MenteeView` handles the swap:

```jsx
<AnimatePresence mode="wait">
  {!wsExpanded
    ? <motion.div key="full" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={FADE}>
        <Artefact ... compact={compact} />
      </motion.div>
    : <motion.div key="mini" ...>
        <Mini syncing={syncing} />
      </motion.div>
  }
</AnimatePresence>
```

`mode="wait"` means the compact card fully exits before the expanded artefact enters. There is a deliberate blank frame between them. This is not a layout animation of one card growing into another — it is one presentation exiting and a different presentation entering. The object is the same. The UI acknowledges that what you are about to see is a different communication plane of the same thing.

This distinction matters for Apple Wallet.

### The Apple Wallet parallel

The compact card and the expanded artefact are the same relationship as an Apple Wallet pass and the full member portal.

The Wallet pass is the compact state. 300px wide. Name, title, avatar, status indicator, QR code on flip. It lives in your phone. It taps at doors. It updates when the underlying object changes — when a section gets accepted, the pass reflects new progress. When stage advances, the pass badge changes. The pass is not a static credential. It is a live projection of the artefact's current state, rendered at wallet size.

The member portal is the expanded state. Full working surface. Sections, workspace, mentor feedback. It lives in the browser. The same data. The same object. Rendered at full fidelity.

```
compact === true    →   Wallet pass   (300px, shareable, live, NFC-readable)
compact === false   →   Member portal (70vw×70vh, interactive, workspace attached)
```

The `compact` boolean is already encoding this. The artefact knows which presentation it is in. The border pulses blue when `syncing` in both states — the pass and the portal share the same sync signal because they are the same object. When a mentor accepts a section, the acceptance propagates to both simultaneously. The member's phone gets a Wallet notification. The portal reflects the new green dot. No translation between them. No sync job between a "pass record" and a "member record." One object, two presentations, one state.

### What the UI needs to know to make this work

The UI already knows everything it needs. The `compact` boolean is the presentation state. `syncing` is the sync state. `sections` is the content state. `stage` is the lifecycle state. These four values are all that a Wallet pass needs:

```
stage   → pass badge / tier indicator
sections.filter(accepted).length / sections.length  → progress field
syncing → "updating…" indicator on pass
avatarSrc  → pass thumbnail
AVA.name, AVA.title  → pass primary/secondary fields
vcard   → QR payload (already in the prototype as the QR code value)
```

The `vcard` string already in the compact card:

```js
const vcard = "BEGIN:VCARD\nVERSION:3.0\nFN:Ava Martinez\nTITLE:Visual Artist & Spatial Designer\nEMAIL:ava@avamartinez.studio\nTEL:+14165550192\nADR:Toronto ON\nURL:https://avamartinez.studio\nEND:VCARD"
```

This is the pass's back-of-card data. On the front: name, title, stage, progress. On flip: full vCard QR. On tap at a door or event: NFC payload encoding the member ID. The pass is the compact card, issued to Apple Wallet.

### Why the spring physics matter here

The `SP` spring on the compact card — `mass:4, stiffness:420, damping:52` — is heavy and snappy. It gives the card the feel of a physical object. Not a modal appearing. Not a panel sliding. A card landing.

This is load-bearing for the Wallet metaphor. Wallet passes feel physical. They have weight. They arrive as notifications with a satisfying snap. The spring physics in the prototype are already anticipating this — the card is being designed to feel like something you hold, not something you look at.

When the prototype eventually becomes an issued pass, the member should feel no discontinuity between the card on screen and the card in their phone. The compact state and the Wallet pass are the same object. The spring that governs one should govern the other.
