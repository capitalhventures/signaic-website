-- Create tables for 3 new free API data sources:
-- 1. NOAA Space Weather Alerts
-- 2. CelesTrak SOCRATES Conjunction Events
-- 3. FAA Launch Licenses

-- ============================================================
-- NOAA Space Weather Alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS space_weather (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT,
  message TEXT,
  issue_time TIMESTAMPTZ,
  severity TEXT,
  source_url TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE space_weather ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view space_weather"
    ON space_weather FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_space_weather_issue_time ON space_weather(issue_time DESC);
CREATE INDEX IF NOT EXISTS idx_space_weather_event_type ON space_weather(event_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_space_weather_dedup ON space_weather(issue_time, event_type);

-- ============================================================
-- CelesTrak SOCRATES Conjunction Events
-- ============================================================
CREATE TABLE IF NOT EXISTS conjunction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object1_name TEXT,
  object1_norad_id TEXT,
  object2_name TEXT,
  object2_norad_id TEXT,
  tca TIMESTAMPTZ,
  min_range_km NUMERIC,
  probability NUMERIC,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE conjunction_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view conjunction_events"
    ON conjunction_events FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_conjunction_tca ON conjunction_events(tca DESC);
CREATE INDEX IF NOT EXISTS idx_conjunction_obj1 ON conjunction_events(object1_norad_id);
CREATE INDEX IF NOT EXISTS idx_conjunction_obj2 ON conjunction_events(object2_norad_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conjunction_dedup ON conjunction_events(object1_norad_id, object2_norad_id, tca);

-- ============================================================
-- FAA Launch Licenses
-- ============================================================
CREATE TABLE IF NOT EXISTS launch_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  licensee TEXT,
  license_number TEXT,
  vehicle TEXT,
  launch_site TEXT,
  issue_date DATE,
  expiry_date DATE,
  status TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE launch_licenses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view launch_licenses"
    ON launch_licenses FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_launch_licenses_number ON launch_licenses(license_number);
CREATE INDEX IF NOT EXISTS idx_launch_licenses_licensee ON launch_licenses(licensee);
CREATE INDEX IF NOT EXISTS idx_launch_licenses_status ON launch_licenses(status);
