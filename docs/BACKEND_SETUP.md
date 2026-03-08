# Backend Infrastructure

## Overview

The backend is built on **Supabase** (PostgreSQL) with **Next.js App Router** API routes. The architecture supports both stub data (for development) and production Supabase queries via a feature flag.

## Directory Structure

```
src/
├── app/api/                    # RESTful API routes
│   ├── health/route.ts         # Health check endpoint
│   ├── members/
│   │   ├── route.ts            # GET /api/members
│   │   └── [memberId]/route.ts # GET/PATCH /api/members/:id
│   ├── sections/
│   │   └── [memberId]/route.ts # GET/PATCH/POST /api/sections/:id
│   └── artefacts/
│       └── [memberId]/route.ts # GET /api/artefacts/:id
├── lib/
│   ├── data/
│   │   ├── members.ts          # Unified data access layer
│   │   ├── seed.ts             # Stub data
│   │   └── queries/            # Supabase query implementations
│   │       ├── index.ts
│   │       ├── members.ts
│   │       ├── sections.ts
│   │       └── programs.ts
│   └── supabase/
│       ├── index.ts            # Re-exports
│       ├── server.ts           # Server-side client
│       ├── client.ts           # Browser-side client
│       ├── admin.ts            # Admin client (migrations only)
│       ├── middleware.ts       # Session refresh
│       └── types.ts            # Database types
├── middleware.ts               # Root middleware for auth
supabase/
└── migrations/
    ├── 001_schema.sql          # Core schema (13 tables)
    └── 002_rls.sql             # Row-level security policies
scripts/
└── seed-database.ts            # Database seed script
```

## Quick Start

### 1. Environment Setup

Copy the example env file and add your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
USE_SUPABASE=false  # Set to 'true' to use production database
```

### 2. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run migrations in the SQL Editor:
   - First: `supabase/migrations/001_schema.sql`
   - Then: `supabase/migrations/002_rls.sql`
3. Seed the database:
   ```bash
   npx tsx scripts/seed-database.ts
   ```

### 3. Enable Supabase

Set `USE_SUPABASE=true` in `.env.local` to switch from stub data to the database.

## API Reference

### Health Check
```
GET /api/health
```
Returns server status and environment info.

### Members
```
GET /api/members?cohortId=xxx     # List all members
GET /api/members/:id              # Get single member
PATCH /api/members/:id            # Update member
```

### Sections
```
GET /api/sections/:memberId                    # Get member's sections
PATCH /api/sections/:memberId?key=practice     # Update section
POST /api/sections/:memberId?action=submit     # Submit section
POST /api/sections/:memberId?action=review     # Review section
```

### Artefacts
```
GET /api/artefacts/:memberId      # Get complete artefact
```

## Data Access Layer

The `src/lib/data/members.ts` module provides a unified interface:

```typescript
// Works with both stub data and Supabase
import { getMembers, getMember, getSections } from "@/lib/data/members";

const members = await getMembers();
const member = await getMember("am");
const sections = await getSections("am");
```

The `USE_SUPABASE` environment variable controls the data source:
- `false` (default): Uses stub data from `seed.ts`
- `true`: Uses Supabase queries from `queries/`

## Database Schema

### Core Tables
- `communities` — Multi-tenant root
- `programs` — Incubator programs
- `cohorts` — Program cohorts
- `members` — User records
- `member_profiles` — Extended profile data
- `artefacts` — Member artefacts (1:1)
- `sections` — Artefact sections
- `stage_transitions` — Audit log

### Views
- `at_risk_members` — Computed risk flag
- `member_progress` — Section completion stats

### Security
Row-level security (RLS) enforces:
- Community isolation
- Role-based access (member, mentor, admin)
- Owner-only updates

## Type Generation

After deploying the schema, generate TypeScript types:

```bash
npx supabase gen types typescript --project-id your-project-id > src/lib/supabase/types.ts
```
