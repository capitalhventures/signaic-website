# Signaic Deployment Guide

## Prerequisites

- Node.js 18+
- Vercel CLI (`npm i -g vercel`)
- Supabase project with migrations applied
- n8n Cloud Pro account for agent orchestration

## Environment Variables

Configure these in Vercel project settings and `.env.local` for local dev:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | Yes |
| `AGENT_SECRET_KEY` | Secret key for agent-to-API authentication | Yes |
| `RESEND_API_KEY` | Resend API key for email alerts | Yes |

**Security Notes:**
- Never prefix server-only keys with `NEXT_PUBLIC_`
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — only used by agent endpoints
- `AGENT_SECRET_KEY` should be a long random string (32+ chars)

## Vercel Deployment

### Initial Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Link to project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add AGENT_SECRET_KEY
vercel env add RESEND_API_KEY
```

### Production Deploy

```bash
# Standard deploy
vercel --prod --yes

# Or via git push (auto-deploys from main)
git push origin main
```

Vercel auto-deploys on push to `main`. The `vercel.json` config sets the framework to Next.js.

### Preview Deploys

Every push to a non-main branch creates a preview deployment URL. Use these for testing before merging.

## Supabase Setup

### Database Migrations

Run migrations in order against your Supabase project. Use the Supabase Dashboard SQL editor or the CLI.

```bash
# Via Supabase CLI (if linked)
supabase db push

# Or manually via SQL editor, run each file in order:
# 1. supabase/migrations/20260326063805_create_app_tables.sql
# 2. supabase/migrations/20260326120000_create_agent_logs.sql
# 3. supabase/migrations/20260326130000_seed_entities.sql
# 4. supabase/migrations/20260327000000_create_admin_users.sql
# 5. supabase/migrations/20260327000100_seed_agent_logs.sql
```

### Required Data Source Tables

These tables should exist in your Supabase project (populated by n8n pipelines):

| Table | Source |
|-------|--------|
| `fcc_filings` | FCC ECFS API |
| `sec_filings` | SEC EDGAR |
| `patents` | USPTO |
| `contracts` | USAspending.gov |
| `federal_register` | Federal Register API |
| `sam_opportunities` | SAM.gov |
| `sbir_awards` | SBIR.gov |
| `orbital_data` | Space-Track.org |
| `news` | Defense news feeds |
| `embeddings` | Generated from all sources |

### RLS Policies

All tables have Row Level Security enabled:
- **User-scoped tables** (conversations, messages, briefs, watchlist): Users can only access their own records
- **Shared tables** (entities, daily_briefings, agent_logs): All authenticated users can read
- **Agent writes** bypass RLS using the service role key

### Admin Users

The `admin_users` table is seeded with initial admin emails. To add a new admin:

```sql
INSERT INTO admin_users (email, role)
VALUES ('newadmin@example.com', 'admin');
```

Also update the hardcoded whitelist in `lib/admin.ts`.

## n8n Workflow Deployment

### MERIDIAN (Daily Briefing)

1. Import `agents/meridian/n8n-workflow.json` into n8n
2. Set the HTTP Request node URL to `https://signaic.com/api/v1/agents/meridian`
3. Set the Authorization header to `Bearer ${AGENT_SECRET_KEY}`
4. Configure cron trigger: `0 6 * * *` (6:00 AM CT daily)
5. Activate the workflow

### SENTINEL (Health Check)

1. Import `agents/sentinel/n8n-workflow.json` into n8n
2. Set the HTTP Request node URL to `https://signaic.com/api/v1/agents/sentinel`
3. Set the Authorization header to `Bearer ${AGENT_SECRET_KEY}`
4. Configure cron trigger: `0 */6 * * *` (every 6 hours)
5. Activate the workflow

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local with all required variables
cp .env.example .env.local

# Run dev server
npm run dev

# Build (must pass before pushing)
npm run build

# Lint
npm run lint
```

## Deployment Checklist

Before deploying to production:

- [ ] `npm run build` passes with zero errors
- [ ] All environment variables are set in Vercel
- [ ] Database migrations are applied in Supabase
- [ ] n8n workflows are active and authenticated
- [ ] Admin users are seeded in `admin_users` table
- [ ] Entity seed data is loaded (30 space/defense entities)
- [ ] Brand color is cyan (#06b6d4), not orange
- [ ] No secrets in client-side code (`NEXT_PUBLIC_` prefix only for public values)
