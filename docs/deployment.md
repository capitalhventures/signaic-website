# Signaic Deployment Guide

## Environment Variables

The following environment variables must be configured in Vercel:

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | Yes |

## Database Setup

Run the migration in `supabase/migrations/001_create_app_tables.sql` against your Supabase project to create the application tables (conversations, messages, briefs, watchlist, daily_briefings).

The following data tables should already exist in your Supabase project:
- fcc_filings
- orbital_data
- patents
- contracts
- sec_filings
- news
- entities
- embeddings
- federal_register
- sam_opportunities
- sbir_awards

## Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Link to existing project
vercel link

# Deploy to production
vercel --prod --yes
```

## Architecture

- **Framework**: Next.js 14 (App Router)
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: Claude API via Anthropic
- **Auth**: Supabase Auth with email/password
- **Styling**: Tailwind CSS
