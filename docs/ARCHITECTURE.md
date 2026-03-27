# Signaic Architecture

## Overview

Signaic is an AI-powered competitive intelligence platform for the space and defense sector. It monitors regulatory filings, contract awards, patent activity, and orbital data — then synthesizes them into actionable intelligence briefings.

**Live:** [signaic.com](https://signaic.com)

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 14 (App Router) | Server/client rendering, API routes |
| Language | TypeScript | Type safety across the stack |
| Database | Supabase (PostgreSQL + pgvector) | Data storage, auth, RLS |
| AI | Claude API (Anthropic) | Intelligence synthesis, chat |
| Hosting | Vercel | Production deployment, edge |
| Orchestration | n8n Cloud Pro | Agent scheduling, workflow automation |
| Email | Resend | Transactional alerts |
| Styling | Tailwind CSS | Utility-first CSS |
| Fonts | Space Grotesk, JetBrains Mono, Orbitron | Brand typography |
| Icons | Lucide React | UI iconography |

## Project Structure

```
signaic-website/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page (public)
│   ├── layout.tsx                # Root layout (fonts, metadata)
│   ├── globals.css               # Global styles + Tailwind
│   ├── (auth)/                   # Auth route group
│   │   ├── login/page.tsx        # Email/password login
│   │   ├── signup/page.tsx       # Registration
│   │   └── confirm/page.tsx      # Email confirmation
│   ├── (dashboard)/              # Protected dashboard route group
│   │   ├── layout.tsx            # Dashboard shell (sidebar + main)
│   │   └── dashboard/
│   │       ├── page.tsx              # Command Center
│   │       ├── ask-raptor/page.tsx   # AI chat interface
│   │       ├── orbital-brief/page.tsx # Report generation
│   │       ├── entities/page.tsx     # Entity browser
│   │       ├── entities/[slug]/      # Entity detail
│   │       ├── data-sources/page.tsx # Pipeline status
│   │       ├── regulatory-guide/     # Regulatory reference
│   │       ├── agents/page.tsx       # Legacy agents view
│   │       └── admin/                # Admin-only section
│   │           ├── layout.tsx        # Admin gate (requireAdmin)
│   │           ├── page.tsx          # Admin overview
│   │           ├── agents/           # Agent operations
│   │           └── financial/        # LEDGER financial model
│   ├── api/v1/                   # API routes (all prefixed /api/v1/)
│   │   ├── chat/route.ts        # Streaming chat with Claude
│   │   ├── briefing/route.ts    # Daily briefing retrieval
│   │   ├── brief/route.ts       # Brief generation
│   │   ├── entities/route.ts    # Entity list (paginated)
│   │   ├── entities/[id]/route.ts # Entity detail
│   │   ├── watchlist/route.ts   # Watchlist CRUD
│   │   ├── watchlist/[id]/route.ts # Watchlist item delete
│   │   ├── sources/status/route.ts # Data source health
│   │   └── agents/
│   │       ├── meridian/route.ts # MERIDIAN briefing endpoint
│   │       └── sentinel/route.ts # SENTINEL health check endpoint
│   └── auth/
│       ├── callback/route.ts     # OAuth callback handler
│       └── signout/route.ts      # Session termination
├── components/
│   ├── sidebar.tsx               # Dashboard navigation sidebar
│   └── ui/                       # Reusable UI components
│       ├── badge.tsx             # Status/category badges
│       ├── button.tsx            # Button variants
│       ├── card.tsx              # Card containers
│       ├── citation.tsx          # Source citations
│       ├── collapsible-card.tsx  # Expandable cards
│       ├── empty-state.tsx       # Empty state placeholder
│       ├── entity-tag.tsx        # Entity mention tags
│       ├── input.tsx             # Form inputs
│       ├── loading-state.tsx     # Loading indicators
│       ├── status-indicator.tsx  # Health status dots
│       └── index.ts             # Barrel exports
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   ├── server.ts            # Server Supabase client
│   │   ├── admin.ts             # Service role client (agents)
│   │   └── middleware.ts        # Auth session middleware
│   ├── admin.ts                 # Admin role checking
│   ├── api-utils.ts             # API response helpers, rate limiting
│   ├── design-tokens.ts         # Design system constants
│   ├── types.ts                 # TypeScript domain types
│   └── utils.ts                 # Utility functions (cn, etc.)
├── agents/
│   ├── meridian/
│   │   ├── generate-briefing.ts # Standalone briefing generator
│   │   ├── n8n-workflow.json    # n8n orchestration config
│   │   └── README.md
│   ├── sentinel/
│   │   ├── health-check.ts      # Standalone health checker
│   │   ├── n8n-workflow.json
│   │   └── README.md
│   ├── seed-entities.ts         # Entity seeding script
│   └── seed-entities.sql        # Entity seed data
├── supabase/
│   └── migrations/              # Database migrations (ordered)
│       ├── 20260326063805_create_app_tables.sql
│       ├── 20260326120000_create_agent_logs.sql
│       ├── 20260326130000_seed_entities.sql
│       ├── 20260327000000_create_admin_users.sql
│       └── 20260327000100_seed_agent_logs.sql
├── docs/
│   ├── ARCHITECTURE.md          # This file
│   └── DEPLOYMENT.md            # Deployment guide
├── middleware.ts                 # Root middleware (auth routing)
├── CLAUDE.md                    # ATLAS agent standing orders
├── PRIORITIES.md                # Current priorities
├── vercel.json                  # Vercel framework config
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Database Schema

### Application Tables

| Table | Purpose | RLS Policy |
|-------|---------|------------|
| `entities` | Companies, agencies, programs (30 seeded) | All authenticated users can read |
| `conversations` | Ask Raptor chat sessions | User-scoped (own only) |
| `messages` | Chat messages with sources & entities | Scoped via conversation ownership |
| `briefs` | Generated Orbital Brief reports | User-scoped (own only) |
| `watchlist` | User's tracked entities | User-scoped (own only) |
| `daily_briefings` | System-generated intelligence briefings | All authenticated users can read |
| `agent_logs` | Agent run audit trail | All authenticated users can read |
| `admin_users` | Admin role assignments | All authenticated users can check |

### Data Source Tables (ingested via n8n pipelines)

| Table | Source | Refresh |
|-------|--------|---------|
| `fcc_filings` | FCC ECFS API | Daily |
| `sec_filings` | SEC EDGAR | Daily |
| `patents` | USPTO | Daily |
| `contracts` | USAspending.gov | Daily |
| `federal_register` | Federal Register API | Daily |
| `sam_opportunities` | SAM.gov | Daily |
| `sbir_awards` | SBIR.gov | Weekly |
| `orbital_data` | Space-Track.org | Daily |
| `news` | Defense news feeds | Every 6 hours |
| `embeddings` | Generated from all sources | On ingest |

### Key Relationships

- `conversations.user_id` → `auth.users.id`
- `messages.conversation_id` → `conversations.id`
- `briefs.user_id` → `auth.users.id`
- `watchlist.user_id` → `auth.users.id`
- `watchlist.entity_id` → `entities.id`
- `admin_users.user_id` → `auth.users.id`

## API Route Inventory

### User-Authenticated Endpoints (Supabase JWT)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/v1/chat` | POST | Stream AI chat responses (Ask Raptor) |
| `GET /api/v1/briefing` | GET | Fetch today's daily intelligence briefing |
| `POST /api/v1/brief` | POST | Generate a custom Orbital Brief report |
| `GET /api/v1/entities` | GET | List entities (paginated, searchable, filterable) |
| `GET /api/v1/entities/[id]` | GET | Get entity detail with source counts |
| `GET /api/v1/watchlist` | GET | List user's watchlist with entity details |
| `POST /api/v1/watchlist` | POST | Add entity to watchlist |
| `DELETE /api/v1/watchlist/[id]` | DELETE | Remove item from watchlist |
| `GET /api/v1/sources/status` | GET | Data source health status |

### Agent Endpoints (AGENT_SECRET_KEY)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/v1/agents/meridian` | POST | Trigger daily briefing generation |
| `POST /api/v1/agents/sentinel` | POST | Trigger data source health check |

## Agent Architecture

Signaic runs 5 autonomous agents, 3 active and 2 pending configuration:

### MERIDIAN — Intelligence Analyst (Active)
- **Trigger:** Daily at 6:00 AM CT via n8n cron
- **Input:** Queries all 9 data source tables for records from past 24 hours
- **Processing:** Claude API synthesizes findings into 3 ranked intelligence items
- **Output:** Upserts to `daily_briefings` table, logs to `agent_logs`
- **Endpoint:** `POST /api/v1/agents/meridian`
- **Code:** `agents/meridian/generate-briefing.ts`

### SENTINEL — Data Pipeline Manager (Active)
- **Trigger:** Every 6 hours via n8n cron
- **Input:** Checks all 11 data source tables for freshness and row counts
- **Processing:** Classifies each source as green/yellow/red based on staleness thresholds
- **Output:** Logs status to `agent_logs`, sends email alerts via Resend for critical issues
- **Endpoint:** `POST /api/v1/agents/sentinel`
- **Code:** `agents/sentinel/health-check.ts`

### ATLAS — Lead Engineer (Active)
- **Trigger:** On-demand via Claude Code
- **Input:** CLAUDE.md standing orders + developer instructions
- **Processing:** Code changes, deployments, infrastructure management
- **Output:** Git commits pushed to main, Vercel production deploys

### LEDGER — Financial Analyst (Pending)
- **Planned:** MRR tracking, cost monitoring, runway forecasting
- **Status:** Static financial model at `/dashboard/admin/financial`

### VECTOR — Content & GTM Manager (Pending)
- **Planned:** Content generation, marketing automation, investor updates
- **Status:** Placeholder

### Agent Authentication
- Agents authenticate via `Authorization: Bearer ${AGENT_SECRET_KEY}` header
- Agent endpoints use the Supabase service role client to bypass RLS
- All agent runs are logged to the `agent_logs` table

### Agent Orchestration
- n8n Cloud Pro manages scheduling via cron triggers
- Each agent has a dedicated n8n workflow (`agents/*/n8n-workflow.json`)
- Workflows call the corresponding `/api/v1/agents/*` HTTP endpoint

## Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Public anon JWT key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Privileged database access (agents) |
| `ANTHROPIC_API_KEY` | Server only | Claude API for chat, briefs, briefings |
| `AGENT_SECRET_KEY` | Server only | Machine-to-machine auth for agent endpoints |
| `RESEND_API_KEY` | Server only | Email alerts (SENTINEL) |

## Authentication Flow

1. User visits `/login` or `/signup`
2. Supabase Auth handles email/password registration and login
3. On success, redirected to `/auth/callback` which sets session cookies
4. Root middleware (`middleware.ts`) calls `updateSession()` on every request
5. Protected routes (`/dashboard/*`) redirect to `/login` if no session
6. Admin routes (`/dashboard/admin/*`) additionally check email against admin whitelist
7. Sign out via `POST /auth/signout` clears cookies

## Design System

- **Brand Color:** Cyan `#06b6d4` (NEVER orange)
- **Dashboard Background:** Slate-50 `#f8fafc` (light)
- **Sidebar:** Slate-900 `#0f172a` (dark, 280px fixed right)
- **Fonts:** Space Grotesk (body), JetBrains Mono (code), Orbitron (display/headings)
- **Cards:** White with slate-200 border, rounded-xl, shadow-card
- **Status Colors:** Emerald (success), Amber (warning only — NOT brand), Red (error)
