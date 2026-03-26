# SENTINEL - Data Pipeline Manager

Sentinel monitors the health and freshness of all Signaic data sources. Every 6 hours, Sentinel checks every data source table for freshness, verifies row counts, detects anomalies, and reports status.

## What It Does

1. Connects to Supabase and checks 11 data source tables
2. For each table: counts rows, finds most recent record, calculates staleness
3. Assigns status:
   - **Green**: Updated within expected refresh interval
   - **Yellow**: More than 2x the expected interval
   - **Red**: More than 5x the expected interval or table empty
4. Writes a full report to `agent_logs`
5. Sends email alert via Resend if any source is red

No AI required - pure monitoring.

## Run Manually

```bash
npx ts-node agents/sentinel/health-check.ts
```

Or via the API endpoint:

```bash
curl -X POST https://signaic.com/api/v1/agents/sentinel \
  -H "Authorization: Bearer YOUR_AGENT_SECRET_KEY" \
  -H "Content-Type: application/json"
```

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) |
| `AGENT_SECRET_KEY` | Secret key for authenticating API endpoint calls |
| `RESEND_API_KEY` | (Optional) Resend API key for email alerts |

## n8n Cron Workflow

Import `n8n-workflow.json` into n8n Cloud. The workflow:

1. **Schedule Trigger**: Fires every 6 hours (cron: `0 */6 * * *` UTC)
2. **HTTP Request**: POST to `https://signaic.com/api/v1/agents/sentinel` with `Authorization: Bearer {AGENT_SECRET_KEY}`
3. **Error Handler**: On failure, sends notification email via Resend

## Monitored Sources

| Source | Expected Refresh |
|--------|-----------------|
| FCC Filings | Every 6 hours |
| SEC Filings | Every 12 hours |
| Patents (USPTO) | Daily |
| Government Contracts | Every 6 hours |
| Orbital Data | Every 2 hours |
| News | Every hour |
| Federal Register | Daily |
| SBIR/STTR Awards | Daily |
| SAM.gov Opportunities | Every 6 hours |
| Entities | Weekly |
| Daily Briefings | Daily |
