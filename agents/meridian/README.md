# MERIDIAN - Intelligence Analyst

Meridian is Signaic's Senior Intelligence Analyst. Every morning at 6:00 AM CT, Meridian pulls the last 24 hours of ingested data across all Supabase source tables, synthesizes it through Claude API with an analyst persona, generates a daily intelligence briefing with exactly 3 actionable items, and writes it to the `daily_briefings` table.

## What It Does

1. Queries 9 source tables for records created/updated in the last 24 hours
2. Aggregates data into a structured context document
3. Calls Claude API (claude-sonnet-4-20250514) with an intelligence analyst system prompt
4. Parses the response as JSON with 3 ranked intelligence items
5. Upserts the briefing into the `daily_briefings` table (re-runs overwrite the same day)
6. Logs success/failure to `agent_logs`

## Run Manually

```bash
npx ts-node agents/meridian/generate-briefing.ts
```

Or via the API endpoint:

```bash
curl -X POST https://signaic.com/api/v1/agents/meridian \
  -H "Authorization: Bearer YOUR_AGENT_SECRET_KEY" \
  -H "Content-Type: application/json"
```

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `AGENT_SECRET_KEY` | Secret key for authenticating API endpoint calls |

## n8n Cron Workflow

Import `n8n-workflow.json` into n8n Cloud. The workflow:

1. **Schedule Trigger**: Fires at 6:00 AM CT daily (cron: `0 11 * * *` UTC)
2. **HTTP Request**: POST to `https://signaic.com/api/v1/agents/meridian` with `Authorization: Bearer {AGENT_SECRET_KEY}`
3. **Error Handler**: On failure, sends notification email via Resend

## Output Schema

```json
{
  "items": [
    {
      "headline": "SpaceX Secures $1.8B NRO Launch Contract Extension",
      "synthesis": "Analysis of what happened, why it matters, what to watch.",
      "entities": [{"name": "SpaceX", "slug": "spacex", "type": "company"}],
      "impact": "high",
      "sources": [{"id": "s1", "title": "Contract Award Notice", "type": "contract", "url": "..."}]
    }
  ],
  "sources_consulted": {"fcc_filings": 12, "contracts": 5},
  "data_gaps": ["No SEC filings data available"]
}
```
