# Artefact Architecture

> Everything is an artefact. The entire product answers one question: **"Where does AI's work go?"**

---

## The Data Model

```typescript
Artefact {
  identity: { name, title, bio, ... }
  rooms: [
    { key, label, visibility, blocks: [...] }
  ]
  events: [ ...every mutation ever... ]
  participants: [ owner, viewers, editors ]
}
```

One primitive. Many manifestations:
- **Personal profile** - your artefact
- **Engagement** - shared artefact with client
- **Community** - collective artefact with members
- **Practice** - your business artefact containing engagements

---

## The Interaction Model

The artefact is not a page you visit. It's an object you **focus** on.

| State | Description |
|-------|-------------|
| **Compact** | The card. Floating in void. Identity + key metrics. Object at rest. |
| **Expanded** | You're inside. Rooms visible. Blocks editable. Object in use. |

Focus change is **spatial, not navigational**. You're not going places. You're looking at objects.

---

## The Permission Model

Every room has visibility:

| Visibility | Description |
|------------|-------------|
| `consultant_only` | Only owner sees |
| `client_view` | Client can read |
| `client_edit` | Client can write |

Same object, different perspective based on who's looking.

---

## The Event Model

Every mutation is an event:

```typescript
{ type: "block.added", roomId, blockId, content, actor, timestamp }
{ type: "room.visibility.changed", roomId, from, to, actor, timestamp }
{ type: "identity.updated", field, value, actor, timestamp }
```

The artefact is **event-sourced**:
- Full audit trail
- Time travel (reconstruct state at any point)
- AI can see evolution
- Conflicts are resolvable

---

## The MCP Interface

### Resources (READ)

```
mcp://engagement/{id}/identity
mcp://engagement/{id}/rooms
mcp://engagement/{id}/rooms/{roomId}/blocks
mcp://engagement/{id}/events?since={timestamp}
```

### Tools (WRITE)

```typescript
engagement.addBlock(roomId, content)
engagement.updateRoom(roomId, { visibility })
engagement.logEvent(type, data)
```

AI becomes a **participant** in the artefact, not just a tool that reads from it.

---

## The Accumulation Dynamic

```
Read artefact state → AI produces output → Write back to artefact → Repeat
```

The artefact **compounds**. Each AI session builds on the last. Nothing is lost.

---

## The Three-Body Problem

| Party | Role |
|-------|------|
| **Consultant** | Produces work, needs context, has private knowledge |
| **Client** | Consumes work, provides input, has partial visibility |
| **AI** | Produces work, needs context, has no inherent persistence |

The artefact is the **coordination layer** for human-human-AI collaboration.

---

## Trust Mechanics

Client enters the artefact. They see:
- Rooms with content (evidence of work)
- Recent events (activity indicator)
- Growing structure (progression over time)

**Trust becomes ambient.** Not reported. Not performed. Just visible.

---

## Switching Cost Architecture

Good lock-in through accumulated value:
- **Event history** - full context, hard to migrate
- **AI training** - more artefacts = better AI for you
- **Client relationships** - clients know how to access your artefacts
- **Compounded structure** - months of accumulated knowledge

---

## Network Effects

| Type | Mechanism |
|------|-----------|
| **Direct** | More consultants → more clients expect artefacts → more adoption |
| **Indirect** | More artefacts → better AI training → AI gets smarter → more value |
| **Cross-side** | Clients prefer consultants who offer artefacts → differentiation |

---

## What Needs to Be Built

### 1. MCP Write Tools
```typescript
tools: {
  "engagement.addBlock": async (roomId, content) => { ... },
  "engagement.updateIdentity": async (fields) => { ... },
  "engagement.logDecision": async (decision) => { ... },
}
```

### 2. One-Click Claude Connection
- OAuth flow or API key setup
- Claude Desktop gets MCP server config

### 3. Client Portal Link
- Unique URL per engagement per client
- Shows their side of the artefact
- Real-time updates

### 4. Demo Video
- Before: 15 min of copy-paste context setup
- After: one click, AI has everything

### 5. Landing Page with ROI Calculator

---

## 30-Day Plan

| Week | Focus |
|------|-------|
| **Week 1** | MCP write tools (addBlock, updateRoom, logEvent) |
| **Week 2** | Client portal MVP (shareable link, read-only view) |
| **Week 3** | Demo video + landing page + ROI calculator |
| **Week 4** | Launch with 10 beta users at $99/mo |

---

## The Core Insight

**Today:** AI output goes nowhere. Chat transcripts. Copy-paste. Lost.

**With artefact:** Into the engagement. Persisted. Accumulated. Shared.

That's the product. Everything else is scaffolding.
