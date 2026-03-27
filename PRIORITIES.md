# Signaic Sprint Priorities

## Week 1 (Current Sprint)

### Day 1 - Complete
- [x] Next.js 14 rebuild from scratch
- [x] 7 dashboard pages (Command Center, Ask Raptor, Orbital Brief, Entities, Data Sources, Regulatory Guide, Settings)
- [x] 8 API routes with rate limiting
- [x] Supabase auth with protected routes
- [x] 6 database tables with RLS
- [x] Landing page
- [x] Vercel deployment

### Day 2 - Complete
- [x] MERIDIAN agent (daily intelligence briefing generation)
- [x] SENTINEL agent (data pipeline health monitoring)
- [x] ATLAS standing orders (CLAUDE.md with Customer vs Admin)
- [x] Entity seeding (30 space/defense entities)
- [x] agent_logs database table
- [x] Command Center live briefing integration
- [x] Data Sources live Sentinel integration
- [x] Remove admin items from customer sidebar
- [x] n8n workflow configs for MERIDIAN and SENTINEL

### Day 3 - Planned
- [ ] Data ingestion pipelines (n8n workflows)
- [ ] FCC ECFS API integration
- [ ] SAM.gov API integration
- [ ] SEC EDGAR integration
- [ ] Federal Register API integration

### Day 4 - Planned
- [ ] pgvector embeddings pipeline
- [ ] Semantic search for Ask Raptor
- [ ] RAG implementation for briefing generation
- [ ] Entity auto-linking from ingested documents

### Day 5 - Planned
- [ ] Enterprise API keys system
- [ ] Usage tracking and billing prep
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

## Key Metrics
- Zero build errors at all times
- All agent workflows running on schedule
- <2s page load times
- RLS on every table

## Architecture Decisions
- Agents authenticate via AGENT_SECRET_KEY (machine-to-machine)
- User auth via Supabase JWT
- All API routes under /api/v1/
- n8n Cloud Pro for workflow orchestration
- Vercel for hosting and edge functions
- Customer sidebar: Intelligence + Data & Reference sections only
- Admin features under /admin/* routes (Session 2)
