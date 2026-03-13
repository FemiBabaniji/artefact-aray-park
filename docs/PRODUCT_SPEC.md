# Product Spec: Engagement Artefact v1

> The engagement data room with trust gradients.

---

## The Use Case

**Sarah runs a $15k brand strategy engagement for ACME Skincare.**

Week 2: She presents three positioning options. Client picks Option B: "clinical efficacy for skeptical millennials."

Week 5: Sarah delivers the messaging framework based on Option B.

Week 6: Client's CEO joins a review call. "Why are we going clinical? Our brand is about self-care rituals." Sarah scrambles through Slack, finds the decision buried in a thread. CEO says "I don't remember approving this." Tension. Rework. Sarah eats 8 hours.

**This happens every engagement.** Decisions get lost. Context evaporates. Consultants spend hours reconstructing history instead of doing work.

---

## The Product

**Engagement Artefact**: A structured data room with rooms and trust gradients.

Not a flat document. An organized space where:
- **Scope & Objectives** — client can see
- **Research & Discovery** — Sarah's eyes only
- **Deliverables** — client can see
- **Meetings & Decisions** — client can see, proof of what was agreed
- **Outcomes & Impact** — client can see
- **Documents** — contracts, SOWs, Sarah's eyes only

Same engagement. Different views for different people. Client sees what builds trust. Sarah keeps what needs to stay internal.

---

## The Room Structure (Already Built)

```typescript
DEFAULT_ENGAGEMENT_ROOMS = [
  { key: "scope",        label: "Scope & Objectives",     visibility: "client_view" },
  { key: "research",     label: "Research & Discovery",   visibility: "consultant_only" },
  { key: "deliverables", label: "Deliverables",           visibility: "client_view" },
  { key: "meetings",     label: "Meetings & Decisions",   visibility: "client_view" },
  { key: "outcomes",     label: "Outcomes & Impact",      visibility: "client_view" },
  { key: "documents",    label: "Documents",              visibility: "consultant_only" },
]
```

**Trust gradients:**
- `consultant_only` — Sarah's internal workspace
- `client_view` — Client can see, not edit
- `client_edit` — Client can contribute (v2)

---

## What Sarah's Engagement Artefact Looks Like

```
┌─────────────────────────────────────────────────────────────────┐
│  ACME Skincare — Brand Strategy                                 │
│  Phase: Delivery    Started: Feb 15    Value: $15,000           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Scope & Objectives ─────────────────────────── client view ─┐
│  │ • Define brand positioning for US market                     │
│  │ • Develop messaging framework for launch                     │
│  │ • Create audience segmentation                               │
│  │ Success: Approved positioning + messaging by April 1         │
│  └──────────────────────────────────────────────────────────────┘
│                                                                 │
│  ┌─ Research & Discovery ──────────────────── consultant only ──┐
│  │ • Competitive analysis (Draft)                               │
│  │ • Interview transcripts (5 files)                            │
│  │ • Internal notes: CMO wants "premium", CEO wants "accessible"│
│  └──────────────────────────────────────────────────────────────┘
│                                                                 │
│  ┌─ Meetings & Decisions ───────────────────────── client view ─┐
│  │                                                              │
│  │ [DECISION] March 3                                           │
│  │ Positioning: Option B — Clinical efficacy                    │
│  │ Rationale: 73% of target prioritize ingredient transparency  │
│  │ Attendees: Sarah, Jake (CMO), Maria (Brand Lead)             │
│  │                                                              │
│  │ [DECISION] March 15                                          │
│  │ Audience segments approved with Segment 2 revision           │
│  │ Added: impulse triggers, social proof sensitivity            │
│  │                                                              │
│  └──────────────────────────────────────────────────────────────┘
│                                                                 │
│  ┌─ Deliverables ───────────────────────────────── client view ─┐
│  │ [PDF] Audience segmentation deck v1 — March 10               │
│  │ [PDF] Messaging framework v1 — March 22                      │
│  └──────────────────────────────────────────────────────────────┘
│                                                                 │
│  ┌─ Documents ─────────────────────────────── consultant only ──┐
│  │ [PDF] Signed SOW — Feb 12                                    │
│  │ [PDF] Invoice #1 — Feb 15                                    │
│  └──────────────────────────────────────────────────────────────┘
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Value

| Pain | Solution |
|------|----------|
| "I don't remember agreeing to that" | Meetings & Decisions room: timestamped decisions |
| "What's the scope again?" | Scope room: always visible, single source of truth |
| "Where's that deliverable?" | Deliverables room: all work products in one place |
| New CEO joins, needs context | Share link → sees client_view rooms only |
| Sarah's research gets exposed | Research room: consultant_only by default |
| End of engagement: "what did we do?" | Outcomes room: tracked results + impact |

**Quantified**: Sarah saves 2-4 hours per engagement on context reconstruction. At $200/hr, that's $400-800 per client.

---

## V1 Scope

### What We Build

| Feature | Why It Matters for Sarah |
|---------|-------------------------|
| **6 default rooms** | Pre-structured: Scope, Research, Deliverables, Meetings, Outcomes, Documents |
| **Room visibility** | consultant_only vs client_view per room |
| **Blocks in rooms** | Text, decision, file blocks within each room |
| **Lifecycle phases** | intake → proposal → signed → delivery → completed |
| **Client portal link** | Client sees client_view rooms only, no login |
| **View tracking** | Sarah knows when client opened portal |
| **Phase timeline** | Visual progress through engagement lifecycle |
| **MCP tools** | Claude can read context and write blocks directly |

### What We Don't Build (v1)

- Client accounts/login
- client_edit visibility (contribution)
- Comments or threads
- Real-time collaboration
- Custom room types
- Room reordering by client
- Channel integrations (v1.5)
- Auto-extraction from calls (v1.5)

---

## Sarah's Workflow

### Day 1: Create the Engagement

Sarah kicks off the ACME project using the wizard at `/practice/engagements/new`:

```
Step 1: Identity
  Name: "ACME Skincare — Brand Strategy"
  Description: "Develop brand positioning and messaging for US launch"

Step 2: Client
  Select: ACME Skincare (or create new)

Step 3: Details
  Value: $15,000
  Start: Feb 15, 2026
  End: April 15, 2026

Step 4: Participants
  Add: Jake (CMO) — jake@acme.com — client_lead
  Add: Maria (Brand Lead) — maria@acme.com — client_member

Step 5: Rooms (defaults pre-filled)
  ✓ Scope & Objectives — client_view
  ✓ Research & Discovery — consultant_only
  ✓ Deliverables — client_view
  ✓ Meetings & Decisions — client_view
  ✓ Outcomes & Impact — client_view
  ✓ Documents — consultant_only

→ Create Engagement
→ Copies client portal link
→ Sends to Jake: "Here's our engagement portal."
```

Jake bookmarks the link. He sees only client_view rooms.

### Week 2: Log a Decision

After the positioning workshop, Sarah opens **Meetings & Decisions** room:

```
+ Add Block

Type: Decision
Title: "Positioning direction selected"
Decision: Option B — Clinical efficacy for skeptical millennials
Rationale: Research showed 73% of target prioritize ingredient transparency
Attendees: Sarah, Jake, Maria
Date: March 3, 2026

→ Save
```

Block appears in the room. Jake sees it next time he opens portal.

Meanwhile, Sarah adds internal notes to **Research & Discovery** (consultant_only):

```
+ Add Block

Type: Note
Content: "CMO pushing premium angle, CEO wants accessible.
Watch for tension. Keep deliverables neutral until aligned."

→ Save
```

Jake never sees this. It's Sarah's internal context.

### Week 3: Attach a Deliverable

Sarah uploads to **Deliverables** room:

```
+ Add Block

Type: File
Upload: acme-audience-segments-v1.pdf
Caption: "4 segments, purchase triggers, channel preferences"

→ Save
```

Also uploads signed SOW to **Documents** (consultant_only) — client doesn't see contracts room.

### Week 6: The CEO Call

CEO asks "why clinical?" Sarah opens the portal on screen:

> "Here's the Meetings & Decisions room. March 3rd — positioning direction selected. Option B, clinical efficacy. Jake and Maria were in that session. Rationale: 73% prioritize ingredient transparency."

CEO sees the timestamp, the attendees, the rationale. Discussion over.

### End of Engagement: Update Outcomes

Sarah adds to **Outcomes & Impact** room:

```
+ Add Block

Type: Text
Content: "Delivered: positioning strategy, messaging framework,
audience segments. Client launched Q3 with 23% higher conversion
than previous campaign benchmark."

→ Save
```

Moves phase from `delivery` → `completed`. Client portal now shows final state.

---

## Block Types (per Room)

| Block Type | Used In | Purpose |
|------------|---------|---------|
| **text** | All rooms | Free-form content, notes |
| **decision** | Meetings & Decisions | Timestamped decision with rationale, attendees |
| **file** | Deliverables, Documents, Research | Uploaded files with caption |
| **outcome** | Outcomes & Impact | Results with metrics |

### Decision Block Schema

```typescript
{
  blockType: "decision",
  content: "Option B — Clinical efficacy for skeptical millennials",
  metadata: {
    title: "Positioning direction selected",
    rationale: "Research showed 73% of target prioritize ingredient transparency",
    attendees: ["Sarah", "Jake", "Maria"],
    decidedAt: "2026-03-03"
  }
}
```

### File Block Schema

```typescript
{
  blockType: "file",
  storagePath: "/engagements/eng_123/deliverables/audience-segments-v1.pdf",
  caption: "4 segments, purchase triggers, channel preferences",
  metadata: {
    fileName: "acme-audience-segments-v1.pdf",
    fileSize: 2400000,
    mimeType: "application/pdf"
  }
}
```

---

## Client Portal View

When Jake opens the portal link (`/portal/{engagementId}?token={shareToken}`):

```
┌─────────────────────────────────────────────────────────────────┐
│  ACME Skincare — Brand Strategy                                 │
│  with Sarah Chen · Phase: Delivery                              │
│  Last updated: 2 days ago                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Scope & Objectives]  [Deliverables]  [Meetings]  [Outcomes]   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─ Meetings & Decisions ───────────────────────────────────────┐
│  │                                                              │
│  │  ● NEW  March 15                                             │
│  │  Approved audience segments with revision                    │
│  │  Added: impulse triggers, social proof sensitivity           │
│  │  Attendees: Sarah, Jake, Maria                               │
│  │  ─────────────────────────────────────────────────────────   │
│  │  March 3                                                     │
│  │  Positioning direction: Option B — Clinical efficacy         │
│  │  Rationale: 73% prioritize ingredient transparency           │
│  │  Attendees: Sarah, Jake, Maria                               │
│  │                                                              │
│  └──────────────────────────────────────────────────────────────┘
│                                                                 │
│  ┌─ Deliverables ───────────────────────────────────────────────┐
│  │  ● NEW  March 22 — Messaging framework v1.pdf                │
│  │  March 10 — Audience segmentation deck v1.pdf                │
│  └──────────────────────────────────────────────────────────────┘
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**What Jake sees:**
- Only `client_view` rooms: Scope, Deliverables, Meetings, Outcomes
- "NEW" badge on items added since last visit
- Download links for files
- Phase timeline showing progress

**What Jake doesn't see:**
- Research & Discovery room (consultant_only)
- Documents room (consultant_only)
- Sarah's internal notes

---

## Technical Architecture

### Database (Already Built)

Schema in `supabase/migrations/014_consulting_os.sql`:

```
clients
├── id, name, slug, industry, logo_url
└── owner_id → auth.users

engagements
├── id, name, slug, phase, value, currency
├── owner_id → auth.users
├── client_id → clients
└── room_schema (JSONB)

engagement_rooms
├── id, key, label, room_type, visibility
├── engagement_id → engagements
└── order_index, prompt, required

engagement_blocks
├── id, block_type, content, storage_path
├── room_id → engagement_rooms
├── metadata (JSONB)
└── order_index, created_by

engagement_events
├── id, event_type, payload (JSONB)
├── engagement_id → engagements
└── actor_id, sequence, created_at

engagement_participants
├── id, name, email, role
├── engagement_id → engagements
└── user_id, client_contact_id
```

### API Routes (Existing + Needed)

```
✓ /api/clients           - CRUD clients
✓ /api/engagements       - CRUD engagements

New:
/api/engagements/{id}/rooms
  GET     - List rooms with blocks

/api/engagements/{id}/rooms/{roomId}/blocks
  POST    - Add block to room
  PATCH   - Update block
  DELETE  - Delete block

/api/engagements/{id}/events
  GET     - List events (activity feed)

/api/engagements/{id}/summarize
  POST    - Generate AI summary

/api/portal/{engagementId}
  GET     - Public view (token auth, client_view rooms only)
```

### Components (Existing + Needed)

```
✓ /src/components/engagement/
    EngagementCreateWizard.tsx    # Built
    EngagementDashboard.tsx       # Shell exists

New:
  dashboard/
    RoomPanel.tsx           # Expandable room with blocks
    BlockEditor.tsx         # Add/edit blocks in room
    BlockList.tsx           # Render blocks by type
    DecisionBlock.tsx       # Decision-specific rendering
    FileBlock.tsx           # File upload + display
    ActivityFeed.tsx        # Event timeline
    SharePanel.tsx          # Copy portal link

  portal/
    PortalView.tsx          # Client-facing read-only view
    PortalRoomList.tsx      # Filtered to client_view only
```

---

## Milestones

### Week 1: Engagement Dashboard

**Goal**: Sarah can view and manage engagement she created via wizard.

- [ ] Engagement dashboard at `/practice/engagements/{id}`
- [ ] Show: identity, phase, rooms with visibility badges
- [ ] Room expansion: see blocks within each room
- [ ] Phase timeline component
- [ ] Participant list component

**Test**: Create engagement via wizard, open dashboard, see all 6 rooms.

### Week 2: Add Blocks to Rooms

**Goal**: Sarah can add content to rooms.

- [ ] Block editor component (text, decision, file types)
- [ ] Add block to specific room
- [ ] Decision block: title, decision, rationale, attendees, date
- [ ] File block: upload to Supabase storage, show in room
- [ ] Blocks respect room's orderIndex

**Test**: Add decision to Meetings room, add file to Deliverables room.

### Week 3: Client Portal

**Goal**: Jake can view client_view rooms via link.

- [ ] Portal route: `/portal/{engagementId}?token={shareToken}`
- [ ] Generate share token on engagement creation
- [ ] Filter rooms: show only `client_view` visibility
- [ ] Log portal view event (actor: "client", type: "portal.viewed")
- [ ] "NEW" badge on blocks added since last view

**Test**: Open portal link in incognito, see only 4 rooms, confirm view logged.

### Week 4: Events + Summary

**Goal**: Event history and AI summary.

- [ ] Event logging on all mutations (block.added, phase.changed, etc.)
- [ ] Activity feed component in dashboard
- [ ] AI summary endpoint: `/api/engagements/{id}/summarize`
- [ ] Summary block type in Outcomes room
- [ ] Practice dashboard links to engagement dashboards

**Test**: Generate summary, verify it captures decisions from Meetings room.

### Week 5-6: Channel Integrations (v1.5)

**Goal**: The engagement captures decisions automatically from calls.

- [ ] Transcript block type + Transcripts room
- [ ] `/api/engagements/{id}/transcripts` endpoint
- [ ] Manual transcript paste UI
- [ ] Agent extraction: decisions, action items, internal notes
- [ ] Review queue component (approve/edit/reject)
- [ ] Zoom webhook integration
- [ ] Slack bot (listen to client channel)

**Test**: Paste meeting transcript, see decision auto-appear in Meetings room with source link.

### Week 7-8: Full Channel Suite

**Goal**: All major channels connected.

- [ ] Email integration (Gmail API)
- [ ] Calendar matching (auto-link meetings to engagements)
- [ ] Teams integration
- [ ] Daily digest notification
- [ ] Confidence scoring on extractions
- [ ] Bulk approve in review queue

**Test**: Have a Zoom call with client, confirm decision logged within 5 minutes without manual input.

---

## What Already Exists

| Component | Status |
|-----------|--------|
| Engagement wizard (`/practice/engagements/new`) | Built |
| Engagement types + room schema | Built |
| Default room templates | Built |
| Phase lifecycle types | Built |
| Practice dashboard | Built |
| Client types | Built |

**What's needed**: Dashboard, block editor, client portal, event logging.

---

## Success = Sarah Uses It

| Signal | What It Means |
|--------|---------------|
| Sarah creates engagement via wizard | Entry point works |
| Sarah adds decision blocks after calls | Logging habit forms |
| Sarah shares portal link with client | Trust value clear |
| Client opens portal 3+ times | Client finds it useful |
| Sarah references portal in dispute | Problem solved |
| Sarah creates engagement for next client | Retention |

**Target**: 5 consultants using it actively for 4+ weeks.

---

## MCP Integration (v1)

The engagement artefact is AI-readable AND AI-writable via MCP. Claude is a participant, not just a tool.

### Resources (Read)

```
GET /api/mcp/resources?uri=engagement://acme-brand-strategy
```

Returns full engagement context:
- Identity (name, description, phase, value)
- Client info
- Rooms with blocks (filtered by visibility for non-owners)
- Participants and roles
- Recent events (last 20 mutations)
- Phase history

### Tools (Write — Direct, No Confirmation)

```
POST /api/mcp/tools
{ "tool": "engagement.logDecision", "arguments": {...} }
```

| Tool | Description |
|------|-------------|
| `engagement.addBlock` | Add content to any room |
| `engagement.logDecision` | Log decision to Meetings room |
| `engagement.addNote` | Add note to any room |
| `engagement.updatePhase` | Change engagement phase |

### AI as Participant

When Claude writes, it's logged as an AI actor:

```
Sarah sees: "Claude added decision block · 2 hours ago"
```

Event schema:
```typescript
{
  event_type: "block.added",
  actor_type: "ai",
  actor_model: "claude-opus-4-5",
  payload: { roomKey: "meetings", blockType: "decision", ... }
}
```

### paper.design Model

AI is a participant in the engagement, not just a tool that reads from it:
- Reads context (rooms, blocks, events, participants)
- Writes content (decisions, notes, summaries)
- Accumulates understanding over the engagement lifecycle

---

## Channel Integrations: The Engagement That Writes Itself

### The Problem with Manual Logging

V1 requires Sarah to manually log decisions. But Sarah won't do it consistently. Nobody does.

Decisions happen in:
- The Zoom call where Jake said "go clinical"
- The Slack thread where Maria shared competitor research
- The email where the CEO asked "why not premium?"
- The voice memo Sarah recorded driving home

**The engagement artefact shouldn't be a place Sarah writes to. It should listen to where work already happens.**

### The Architecture

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Zoom    │  │  Slack   │  │  Email   │  │ Discord  │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │
     ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────┐
│                   AGENT LAYER                       │
│   Listens → Understands → Extracts → Structures    │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              ENGAGEMENT ARTEFACT                    │
│  Scope │ Research │ Deliverables │ Meetings │ ...  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
                 ┌──────────────┐
                 │ Client Portal │
                 └──────────────┘
```

### Supported Channels

| Channel | Integration Method | What Gets Captured |
|---------|-------------------|-------------------|
| **Zoom** | Webhook on recording ready | Transcript → decisions, action items |
| **Google Meet** | Calendar integration + transcript API | Same as Zoom |
| **Microsoft Teams** | Graph API webhook | Transcript + chat messages |
| **Slack** | Bot in client channel | Decisions, approvals, key threads |
| **Email** | Gmail/Outlook API | Client correspondence, approvals |
| **Discord** | Bot in team server | Internal discussions, decisions |
| **Otter.ai** | Webhook integration | Real-time meeting transcription |
| **Fireflies.ai** | Webhook integration | Auto-joins meetings, transcribes |

### New Room: Transcripts

```typescript
DEFAULT_ENGAGEMENT_ROOMS = [
  // ... existing rooms
  { key: "transcripts", label: "Meeting Transcripts", visibility: "consultant_only" },
]
```

Raw transcripts stay internal. Extracted decisions flow to Meetings room (client_view).

### New Block Type: Transcript

```typescript
{
  blockType: "transcript",
  content: "Full transcript text...",
  metadata: {
    source: "zoom" | "meet" | "teams" | "otter" | "manual",
    duration: 3600,
    recordedAt: "2026-03-03T14:00:00Z",
    extractedBlocks: ["block_id_1", "block_id_2"],  // links to created blocks
    channelId: "zoom_meeting_123"
  }
}
```

### New Block Type: Channel Message

```typescript
{
  blockType: "channel_message",
  content: "Let's go with Option B for the positioning.",
  metadata: {
    source: "slack" | "email" | "discord" | "teams",
    author: "Jake (CMO)",
    timestamp: "2026-03-03T14:32:00Z",
    threadUrl: "https://acme.slack.com/archives/...",
    extractedAs: "decision"  // or "approval", "question", "note"
  }
}
```

### How Extraction Works

Agent processes incoming content and classifies:

| Detected Pattern | Action |
|-----------------|--------|
| "Let's go with...", "I approve...", "Decision:" | → Decision block in Meetings room |
| Client question about scope/direction | → Flag for Sarah's review |
| Internal team discussion | → Note in Research room |
| File attachment from client | → File block in appropriate room |
| Approval/sign-off language | → Decision block with approval metadata |

### Trust Gradient Awareness

Agent understands visibility based on source:

| Source | Default Room | Visibility |
|--------|--------------|------------|
| Client email | Meetings | client_view |
| Client call transcript | Transcripts | consultant_only |
| Extracted decision from call | Meetings | client_view |
| Internal Slack | Research | consultant_only |
| Team Discord | Research | consultant_only |
| Client Slack channel | Meetings | client_view |

### API Endpoints

```
/api/engagements/{id}/channels
  GET     - List connected channels
  POST    - Connect new channel

/api/engagements/{id}/transcripts
  POST    - Upload/ingest transcript
  GET     - List transcripts

/api/webhooks/zoom
  POST    - Zoom recording webhook

/api/webhooks/slack
  POST    - Slack event webhook

/api/webhooks/calendar
  POST    - Calendar event (match to engagement by participants)
```

### Webhook Flow

```
Zoom call ends
  ↓
Zoom sends webhook: recording_completed
  ↓
System downloads transcript
  ↓
Matches to engagement by participant emails
  ↓
Agent extracts:
  → Decisions → Meetings room (client_view)
  → Internal notes → Research room (consultant_only)
  → Action items → Scope room or external task system
  ↓
Sarah gets notification: "2 decisions captured from ACME call"
  ↓
Sarah reviews, edits if needed (30 seconds vs 5 minutes manual)
```

### Review Queue

Sarah doesn't blindly trust AI extraction. Daily review:

```
┌─ Today's Captures ──────────────────────────────────────────────┐
│                                                                 │
│  ● Decision captured (Zoom, 2:30pm)                    [Review] │
│    "Positioning: Option B — Clinical efficacy"                  │
│    Confidence: High · Attendees matched                         │
│                                                                 │
│  ● Possible decision (Slack, 4:15pm)                   [Review] │
│    "CEO asking about premium angle"                             │
│    Confidence: Medium · May be question not decision            │
│                                                                 │
│  ● Note added (Email, 11am)                            [Review] │
│    Client shared competitor link                                │
│    Confidence: High · Auto-filed to Research                    │
│                                                                 │
│                                          [Approve All] [Edit]   │
└─────────────────────────────────────────────────────────────────┘
```

### Updated Workflow: Week 2

**Before (Manual):**
```
3:00pm — Call ends
3:01pm — Sarah has another call
5:00pm — Sarah remembers to log decision
5:15pm — Sarah reconstructs from memory, misses details
```

**After (Auto-capture):**
```
3:00pm — Call ends
3:01pm — Zoom webhook fires
3:02pm — Agent processes transcript
3:03pm — Decision block created in Meetings room
3:04pm — Sarah gets notification
3:05pm — Sarah reviews, approves (or edits)
Done. 30 seconds. Full context preserved.
```

### MCP Tools for Channel Integration

```typescript
// Ingest transcript and extract blocks
{ name: "engagement.ingestTranscript" }

// Connect channel to engagement
{ name: "engagement.connectChannel" }

// Process pending extractions
{ name: "engagement.processQueue" }

// Manual extraction from text
{ name: "engagement.extractFromText" }
```

### Target PMF Segments

| Segment | Why Channel Integration Matters |
|---------|--------------------------------|
| **Fractional Executives** | 3-5 clients, calls all day, no time to log manually |
| **IT Implementation Consultants** | Scope decisions = money, need proof from calls |
| **Agency Account Managers** | Client calls + internal Slack, context scattered |
| **Customer Success Managers** | Ongoing relationships, stakeholder changes |

### Pricing Implication

```
Free:   Manual logging only
Pro:    Manual + MCP tools (AI can write)
Team:   Everything + Channel integrations (AI listens + writes)
```

The upgrade sells itself. First time someone spends 20 minutes reconstructing a call decision, they upgrade.

---

## What Comes After (v2+)

| Feature | Trigger |
|---------|---------|
| **client_edit visibility** | "Jake wants to add his notes" |
| **Comments on blocks** | "We need threaded discussion" |
| **Custom room types** | "I need a room for client feedback" |
| **Email notifications** | "Tell me when Jake views" |
| **Room templates by engagement type** | "Strategy engagements need different rooms than audits" |
| **Calendar integration** | Auto-create engagement from calendar invite |
| **CRM sync** | Push engagement data to HubSpot/Salesforce |
| **Task system integration** | Action items → Linear/Asana/Notion |

---

## The Pitch

**V1: The Structured Data Room**

> "Your engagement has a data room. Clients see what builds trust. You keep what's internal."
>
> Scope in one room. Decisions in another. Research stays hidden. Deliverables tracked.
>
> Next time someone asks "why did we do this?" — open the Meetings room. 10 seconds.

**V1.5+: The Engagement That Writes Itself**

> Your engagement runs across Zoom, Slack, email, and a dozen other places.
>
> Decisions happen. Context accumulates. Then it disappears.
>
> **What if it didn't?**
>
> Connect your channels. Let the agent listen. Watch your engagement build itself.
>
> Clients see what matters. You keep what's internal. Nothing gets lost.
>
> The call ends at 3pm. By 3:05pm, the decision is logged, timestamped, and visible in the client portal.
>
> **Stop being your own stenographer.**

---

## Concurrency & Reliability

### The Problem

Multiple writers can collide:
- Sarah edits a block in the dashboard
- AI writes via MCP at the same time
- Sarah has two browser tabs open
- v2: Client edits via portal while Sarah edits

Without concurrency control, last-write-wins silently. Sarah's edit disappears. No error, no warning.

### Strategy: Optimistic Locking

Every mutable entity gets a `version` column. Writers must provide the current version. If versions don't match, reject with 409 Conflict.

```
Sarah loads block (version: 3)
AI loads block (version: 3)
Sarah saves → version bumps to 4 ✓
AI saves with version 3 → 409 Conflict ✗
AI must reload, get version 4, re-apply changes
```

### Schema Changes

```sql
-- Add to engagement_blocks
ALTER TABLE engagement_blocks ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE engagement_blocks ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();

-- Add to engagements (for phase changes, room_schema updates)
ALTER TABLE engagements ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Add to engagement_rooms (for reordering, visibility changes)
ALTER TABLE engagement_rooms ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
```

### API Contract

**Update block request:**
```typescript
PATCH /api/engagements/{id}/rooms/{roomId}/blocks/{blockId}
{
  "content": "Updated decision text",
  "version": 3  // Required: current version client has
}
```

**Success response (200):**
```typescript
{
  "id": "block_123",
  "content": "Updated decision text",
  "version": 4,  // Incremented
  "updated_at": "2026-03-12T14:30:00Z"
}
```

**Conflict response (409):**
```typescript
{
  "error": "conflict",
  "message": "Block was modified by another user",
  "current_version": 5,
  "current_content": "...",  // Let client show diff
  "updated_by": "ai",        // or "user_id"
  "updated_at": "2026-03-12T14:29:55Z"
}
```

### Client Handling

Dashboard and MCP tools must handle 409:

1. **Dashboard UI**: Show conflict modal with diff, let Sarah choose her version or theirs
2. **MCP tools**: Reload block, re-apply AI changes to latest version, retry once
3. **Portal (v2)**: Same as dashboard — show conflict, let client resolve

### Add-Only Operations

Block creation (`POST`) doesn't need optimistic locking — just append. Conflicts only matter for:
- `PATCH` block content/metadata
- `DELETE` block (check version to avoid deleting edited block)
- `PATCH` engagement phase
- `PATCH` room visibility/order

---

## Block Versioning & History

### Version History Table

For audit trail and undo:

```sql
CREATE TABLE engagement_block_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES engagement_blocks(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT,
  metadata JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_type TEXT NOT NULL DEFAULT 'user',  -- 'user', 'ai', 'system'
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(block_id, version)
);

-- Trigger: on block update, copy old values to versions table
CREATE OR REPLACE FUNCTION archive_block_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO engagement_block_versions (block_id, version, content, metadata, changed_by, changed_by_type, changed_at)
  VALUES (OLD.id, OLD.version, OLD.content, OLD.metadata, OLD.updated_by, OLD.updated_by_type, OLD.updated_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER block_version_archive
BEFORE UPDATE ON engagement_blocks
FOR EACH ROW EXECUTE FUNCTION archive_block_version();
```

### Viewing History

```
GET /api/engagements/{id}/rooms/{roomId}/blocks/{blockId}/history

[
  { "version": 3, "content": "...", "changed_by": "Sarah", "changed_at": "..." },
  { "version": 2, "content": "...", "changed_by": "Claude", "changed_at": "..." },
  { "version": 1, "content": "...", "changed_by": "Sarah", "changed_at": "..." }
]
```

### Restore Previous Version

```
POST /api/engagements/{id}/rooms/{roomId}/blocks/{blockId}/restore
{ "target_version": 2, "current_version": 3 }
```

Creates new version (4) with content from version 2. Doesn't rewrite history.

---

## Webhook Reliability (v1.5)

### The Problem

Webhooks fail. Networks timeout. Servers restart mid-process. Without reliability handling:
- Zoom sends webhook, our server 500s — transcript lost forever
- Duplicate webhooks create duplicate decisions
- Partial failure: transcript saved, extraction never ran

### Ingestion Jobs Table

Track every inbound webhook as a job:

```sql
CREATE TABLE ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Idempotency
  idempotency_key TEXT UNIQUE NOT NULL,  -- e.g., "zoom:meeting_123:recording_456"

  -- Source
  source TEXT NOT NULL,          -- 'zoom', 'slack', 'email', 'manual'
  source_event_id TEXT,          -- External ID from source system
  source_payload JSONB,          -- Raw webhook payload (for replay)

  -- Routing
  engagement_id UUID REFERENCES engagements(id),
  matched_by TEXT,               -- 'participant_email', 'channel_id', 'manual'

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed', 'dead'

  -- Processing
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,

  -- Results
  created_blocks UUID[],         -- Block IDs created from this job
  transcript_id UUID,            -- If transcript block was created

  -- Timestamps
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Index for retry queue
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ingestion_jobs_retry ON ingestion_jobs (status, next_retry_at)
  WHERE status IN ('pending', 'failed');
CREATE INDEX idx_ingestion_jobs_engagement ON ingestion_jobs (engagement_id);
```

### Webhook Handler Flow

```typescript
// POST /api/webhooks/zoom
async function handleZoomWebhook(payload: ZoomWebhookPayload) {
  // 1. Generate idempotency key
  const idempotencyKey = `zoom:${payload.meeting_id}:${payload.recording_id}`;

  // 2. Check for existing job (idempotent)
  const existing = await db.ingestionJobs.findByKey(idempotencyKey);
  if (existing) {
    return { status: 200, message: "Already processed" };
  }

  // 3. Create job record immediately (before any processing)
  const job = await db.ingestionJobs.create({
    idempotency_key: idempotencyKey,
    source: 'zoom',
    source_event_id: payload.recording_id,
    source_payload: payload,
    status: 'pending'
  });

  // 4. Return 200 to Zoom immediately (don't make them wait)
  // Process async via queue
  await queue.enqueue('process-ingestion', { jobId: job.id });

  return { status: 200, job_id: job.id };
}
```

### Processing Worker

```typescript
async function processIngestionJob(jobId: string) {
  const job = await db.ingestionJobs.find(jobId);

  // Mark processing
  await db.ingestionJobs.update(jobId, {
    status: 'processing',
    attempts: job.attempts + 1,
    last_attempt_at: new Date()
  });

  try {
    // 1. Download transcript from Zoom
    const transcript = await zoom.downloadTranscript(job.source_payload);

    // 2. Match to engagement by participant emails
    const engagement = await matchEngagement(job.source_payload.participants);
    if (!engagement) {
      throw new Error('No matching engagement found');
    }

    // 3. Create transcript block
    const transcriptBlock = await createTranscriptBlock(engagement.id, transcript);

    // 4. Extract decisions/notes via AI
    const extractedBlocks = await extractFromTranscript(transcript, engagement);

    // 5. Mark completed
    await db.ingestionJobs.update(jobId, {
      status: 'completed',
      engagement_id: engagement.id,
      matched_by: 'participant_email',
      transcript_id: transcriptBlock.id,
      created_blocks: extractedBlocks.map(b => b.id),
      completed_at: new Date()
    });

  } catch (error) {
    await handleJobFailure(jobId, error);
  }
}
```

### Retry Logic

```typescript
async function handleJobFailure(jobId: string, error: Error) {
  const job = await db.ingestionJobs.find(jobId);

  // Exponential backoff: 1min, 5min, 30min, 2hr, 12hr
  const backoffMinutes = [1, 5, 30, 120, 720];
  const nextRetryIndex = Math.min(job.attempts, backoffMinutes.length - 1);

  if (job.attempts >= 5) {
    // Give up — move to dead letter queue
    await db.ingestionJobs.update(jobId, {
      status: 'dead',
      error_message: error.message
    });

    // Alert Sarah
    await notify.send(job.engagement_id, {
      type: 'ingestion_failed',
      message: `Failed to process ${job.source} recording after 5 attempts`,
      job_id: jobId
    });

  } else {
    // Schedule retry
    const nextRetry = addMinutes(new Date(), backoffMinutes[nextRetryIndex]);
    await db.ingestionJobs.update(jobId, {
      status: 'failed',
      error_message: error.message,
      next_retry_at: nextRetry
    });
  }
}
```

### Retry Cron

```typescript
// Runs every minute
async function retryFailedJobs() {
  const jobs = await db.ingestionJobs.findReadyForRetry();

  for (const job of jobs) {
    await queue.enqueue('process-ingestion', { jobId: job.id });
  }
}
```

### Manual Replay

If a job fails permanently, Sarah can replay from dashboard:

```
POST /api/ingestion-jobs/{jobId}/replay
```

Resets attempts to 0, status to 'pending', re-enqueues.

### Partial Failure Handling

Jobs track progress. If transcript saved but extraction failed:

```typescript
// On retry, check what already succeeded
if (job.transcript_id && !job.created_blocks?.length) {
  // Skip transcript download, just re-run extraction
  const transcript = await db.blocks.find(job.transcript_id);
  const extractedBlocks = await extractFromTranscript(transcript.content, engagement);
  // ...
}
```

### Dashboard: Ingestion Status

Sarah sees ingestion health:

```
┌─ Channel Ingestion ─────────────────────────────────────────────┐
│                                                                 │
│  ✓ Zoom call (Mar 12, 2:30pm)           Completed · 2 decisions │
│  ✓ Slack thread (Mar 12, 11:00am)       Completed · 1 note      │
│  ⟳ Zoom call (Mar 12, 4:00pm)           Retry 2/5 · 14:32       │
│  ✗ Email sync (Mar 11)                  Failed · [Replay]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary: What These Add

| Gap | Solution |
|-----|----------|
| Concurrent edits collide silently | Optimistic locking with `version` column, 409 Conflict responses |
| No edit history | `engagement_block_versions` table with trigger-based archiving |
| Webhook failures lose data | `ingestion_jobs` table with idempotency keys |
| No retry logic | Exponential backoff, dead letter queue, manual replay |
| Partial failures | Job tracks progress, resumes from last checkpoint |
| Sarah doesn't know status | Dashboard shows ingestion job status |
