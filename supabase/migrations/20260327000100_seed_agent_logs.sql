-- Seed agent_logs with realistic sample entries for MERIDIAN and SENTINEL

INSERT INTO agent_logs (agent_name, run_type, status, summary, details, created_at) VALUES
  ('meridian', 'daily_briefing', 'success',
   'Generated 3 intelligence items from 47 source records',
   '{"items_generated": 3, "sources_scanned": 47, "entities_mentioned": ["SpaceX", "Northrop Grumman", "Space Force"], "duration_ms": 12400}',
   now() - interval '2 hours'),

  ('meridian', 'daily_briefing', 'success',
   'Generated 3 intelligence items from 52 source records',
   '{"items_generated": 3, "sources_scanned": 52, "entities_mentioned": ["Blue Origin", "L3Harris", "DARPA"], "duration_ms": 11800}',
   now() - interval '26 hours'),

  ('meridian', 'daily_briefing', 'warning',
   'Generated 2 intelligence items — FCC source returned empty results',
   '{"items_generated": 2, "sources_scanned": 38, "missing_sources": ["fcc_filings"], "duration_ms": 9200}',
   now() - interval '50 hours'),

  ('sentinel', 'health_check', 'success',
   'All 11 sources healthy — 0 stale, 0 errors',
   '{"sources_checked": 11, "green": 11, "yellow": 0, "red": 0, "total_records": 14250}',
   now() - interval '1 hour'),

  ('sentinel', 'health_check', 'success',
   'All 11 sources healthy — 0 stale, 0 errors',
   '{"sources_checked": 11, "green": 11, "yellow": 0, "red": 0, "total_records": 14180}',
   now() - interval '7 hours'),

  ('sentinel', 'health_check', 'warning',
   '1 source degraded: orbital_data last updated 36h ago',
   '{"sources_checked": 11, "green": 10, "yellow": 1, "red": 0, "degraded_sources": ["orbital_data"]}',
   now() - interval '13 hours'),

  ('sentinel', 'health_check', 'success',
   'All 11 sources healthy after orbital_data refresh',
   '{"sources_checked": 11, "green": 11, "yellow": 0, "red": 0, "total_records": 14100}',
   now() - interval '19 hours'),

  ('sentinel', 'health_check', 'error',
   'Connection timeout to SAM.gov API — retrying in 30 minutes',
   '{"sources_checked": 11, "green": 9, "yellow": 1, "red": 1, "error_sources": ["sam_opportunities"], "error_detail": "ETIMEDOUT after 30s"}',
   now() - interval '31 hours'),

  ('meridian', 'daily_briefing', 'success',
   'Generated 3 intelligence items from 61 source records',
   '{"items_generated": 3, "sources_scanned": 61, "entities_mentioned": ["Rocket Lab", "NASA", "Lockheed Martin", "FCC"], "duration_ms": 13100}',
   now() - interval '74 hours'),

  ('sentinel', 'alert', 'error',
   'CRITICAL: sec_filings source has 0 records — pipeline may be broken',
   '{"source": "sec_filings", "expected_min": 100, "actual": 0, "alert_sent_to": "ryan@signaic.com"}',
   now() - interval '96 hours');
