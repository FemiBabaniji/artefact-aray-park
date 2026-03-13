# Render Layer: Composable Presentation for Artefacts

> The artefact isn't a client portal bolted onto a project management tool. It's a single source of state that the consultant shapes and then renders into whatever context they need.

---

## The Core Insight

The same underlying artefact state renders into multiple contexts:

| Context | Audience | Purpose |
|---------|----------|---------|
| **Client Portal** | Client stakeholders | Live dashboard mid-engagement |
| **Pitch Deck** | Prospective clients | New business conversation |
| **Board Summary** | Executives | High-level progress view |
| **Handover Document** | Successor consultant | Engagement close |
| **Demo Render** | Sales prospects | Show what their engagement will look like |

Same data. Different render configurations. Everything stays live and current — not snapshots that go stale.

**This changes the value proposition.** The consultant isn't buying "better client communication." They're buying a composable presentation layer for their work — institutional memory with a presentation engine on top.

---

## The Configuration Experience

### Design Principle: Intent-First

Consultants think in contexts, not components. The abstraction that makes this usable is "what are you making this for."

```
○ Client Portal    ○ Pitch Deck    ○ Board Summary    ○ Handover Doc    ○ Demo Render
```

When they pick an intent, sensible defaults collapse 80% of the configuration work.

### Three-Layer Configuration

**Layer 1: Pick a render intent**

Each intent has defaults:
- Which rooms to include
- Which template/preset per room
- What sequence to render

**Layer 2: Include/exclude rooms**

```
┌─ Rooms to Include ─────────────────────────────────────┐
│ ✓ Scope & Objectives       template: pitch / minimal   │
│ ✓ Outcomes & Impact        template: traction / dashboard │
│ ✗ Research & Discovery     (consultant_only, hidden)   │
│ ✓ Meetings & Decisions     template: timeline / journey │
└────────────────────────────────────────────────────────┘
```

Toggle rooms on/off. Per-room template + preset dropdowns. Live preview on the right.

**Layer 3: Save as named render**

```
Name: ACME Board Update Q1
→ Save | → Save as Practice Template | → Share Link | → Export PDF
```

---

## Featured Blocks: Composition Without a Composer

### The Problem

Room-level toggling produces pitch decks that are too long and poorly sequenced. A pitch deck isn't "show the Outcomes room" — it's "show the headline metric from Outcomes, the problem statement from Scope, and the key decision from Meetings, in that order, with nothing else."

### The Solution: One Featured Block Per Room

The consultant marks one block per room as the headline. Cross-room renders pull featured blocks only.

**Data model:**

```sql
ALTER TABLE engagement_blocks ADD COLUMN featured BOOLEAN DEFAULT false;
```

Constraint: one featured block per room, enforced by the application (unfeaturing the previous when a new one is featured).

**UX:**

- Star icon on each block
- Click to feature
- Previous featured block in that room un-features automatically
- Preview panel shows: "This is what appears in Pitch Deck view"

**How intents use featured blocks:**

| Intent | Featured Block Behavior |
|--------|------------------------|
| Client Portal | Shows all blocks (featured has subtle highlight) |
| Pitch Deck | Shows only featured blocks, narrative sequence |
| Board Summary | Shows featured blocks from Outcomes + Scope + one decision |
| Handover Doc | Shows featured blocks from all rooms, chronologically |

The render intent controls which rooms contribute and in what order. Featured blocks control what surfaces from each room.

---

## Demo Renders: Past Engagements as Sales Assets

### The Use Case

Every completed engagement is evidence for the next sale. When a consultant shows a prospective client "here's what your engagement portal will look like" — using a live demo render from a past engagement with sensitive data swapped out — that's a closing tool.

### Render-Time Masking

Masks are transforms applied at render time, not modifications to the underlying data.

```typescript
renderConfig: {
  intent: "demo",
  masks: {
    clientName: "[Client Name]",
    participantNames: ["[CMO]", "[Brand Lead]"],
    figures: "pattern"  // $XX,XXX, XX%
  }
}
```

**Why render-time:**
- The real engagement stays intact and auditable
- One-click reset works because there's nothing to undo
- The mask was never applied to the data

### Manual Mask Annotations

Pattern matching misses contextual figures ("we reduced the team from 12 to 8"). The consultant needs to tag sensitive values during the engagement.

**Interaction:**
1. In any text block, consultant highlights a phrase
2. Context menu: "Mark as sensitive"
3. Phrase stored as mask annotation on the block

**Data model:**

```sql
ALTER TABLE engagement_blocks ADD COLUMN mask_annotations JSONB;
-- Format: [{ "start": 45, "end": 53, "placeholder": "[team size]" }]
```

Demo render applies:
1. Stored mask annotations
2. Pattern-matched masks (currencies, percentages)
3. Global masks (client name, participant names)

---

## Platform-Level Templates

### The Decision

Templates live at the **platform level**, not consultant-only.

### Why Platform-Level

**Cold start problem:** Consultant signs up, creates first engagement, lands on render configuration, sees: empty. No templates. They have to invent the structure before they can use the product. That's abandonment.

**The first session needs to feel like "this already knows what I do."** Platform templates create that feeling.

### Starter Templates (Ship at Launch)

| Template | Rooms | Default Render Intents |
|----------|-------|------------------------|
| **Strategy Engagement** | Scope, Research, Deliverables, Meetings, Outcomes | Client portal + board summary |
| **Fractional Executive** | Objectives, Activities, Decisions, Metrics | Weekly update + quarterly review |
| **Implementation Project** | Scope, Milestones, Issues, Handover | Client portal + project close |
| **Advisory Retainer** | Topics, Sessions, Recommendations | Session recap + relationship summary |
| **Due Diligence** | Scope, Findings, Risk Register, Report | Client portal + final report |

Each template includes:
- Default rooms with visibility presets
- Suggested block types per room
- Pre-configured render intents with room selections
- Sample featured block guidance

### Template Data Model

```sql
CREATE TABLE render_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  owner_id UUID REFERENCES auth.users(id),  -- null = platform template
  practice_id UUID REFERENCES practices(id), -- null = platform or personal

  -- Identity
  name TEXT NOT NULL,
  description TEXT,
  engagement_type TEXT,  -- 'strategy', 'fractional', 'implementation', etc.

  -- Configuration
  room_schema JSONB NOT NULL,      -- default rooms + visibility
  render_intents JSONB NOT NULL,   -- named renders with room selections
  block_guidance JSONB,            -- suggested block types per room
  mask_patterns JSONB,             -- default masking rules

  -- Visibility
  visibility TEXT DEFAULT 'private',  -- 'private', 'practice', 'public'

  -- Metadata
  fork_count INTEGER DEFAULT 0,
  forked_from UUID REFERENCES render_templates(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### How It Works

**V1:**
- Platform templates ship with `owner_id = null`, `visibility = 'public'`
- When consultant customizes, it forks to `owner_id = their id`, `visibility = 'private'`
- "Save as practice template" stores with `visibility = 'private'`, `forked_from` pointing to source

**Future (community play):**
- Consultant sets `visibility = 'public'`
- Fork counter shows which templates are actually good
- No new architecture needed — one column change

---

## Practice Templates in V1

### The Problem

Consultant configures client portal intent for engagement one. Starts engagement two. If they reconfigure from scratch, the second engagement has higher friction than the first. The system should get easier with use, not stay flat.

### The Solution

When a consultant saves a named render:

```
[ Save Render ]  [ Save as Practice Template ]
```

The second button creates a `render_template` record with their customizations. When engagement two starts:

> "You have a saved template from ACME engagement. Use it?"

The data exists from day one. The apply-template feature is just a query.

---

## Practice Intelligence (Data Model for Future)

### The Insight

What rooms and blocks get featured tells you what clients care about. Across engagements, the consultant builds a signal layer:
- Which outcomes blocks get featured most
- Which decision types recur
- Which phases run long

That's practice intelligence. It answers "what do I actually do well" and "where do my engagements typically stall."

### Architectural Principle

**Log everything that might matter for pattern recognition, even if you're not building the analysis UI yet.**

The cost of logging is trivial. The cost of not having the data is a migration that can't recover historical patterns.

### Events to Log

```typescript
{ type: "block.featured", block_id, room_id, engagement_id, timestamp }
{ type: "block.unfeatured", block_id, room_id, engagement_id, timestamp }
{ type: "phase.changed", from, to, engagement_id, timestamp, duration_in_phase }
{ type: "render.created", render_intent, engagement_id, timestamp }
{ type: "render.shared", render_intent, audience_type, engagement_id, timestamp }
{ type: "render.viewed", render_id, viewer_type, engagement_id, timestamp }
{ type: "template.forked", template_id, engagement_id, timestamp }
```

---

## The Product Category

**Not project management. Not client communication. A practice asset system.**

The engagement artefact compounds value across the full consulting lifecycle:

| Phase | Value |
|-------|-------|
| **During delivery** | Client portal, trust layer, decision log |
| **At close** | Handover doc, outcomes record |
| **Post-engagement** | Case study source, demo render for sales |
| **Across engagements** | Pattern recognition, practice intelligence |

The consultant isn't paying for better project management. They're paying for a system that turns every engagement into a reusable asset for future work.

---

## Summary: What Ships in V1

| Feature | Status |
|---------|--------|
| Featured blocks (one per room, star icon) | V1 |
| Render intents with room selection | V1 |
| Named renders per engagement | V1 |
| Platform starter templates (5 engagement types) | V1 |
| "Save as practice template" button | V1 |
| Render-time masking for demo renders | V1 |
| Manual mask annotations (highlight-to-mask) | V1 |
| Event logging for all mutations | V1 |
| Template fork tracking | V1 |
| Practice intelligence UI | Future |
| Community template sharing UI | Future |

The data model supports all future features. The UI ships incrementally.
