-- Session E-SOURCES-2: Add 11 new data source tables to reach 30 total
-- Sources: DARPA Opportunities, UCS Satellites, CSIS, DIU, Bryce Tech,
--          Space Capital, SIA, NATO Procurement, ESA Copernicus, ITU BRIFIC,
--          Congressional Space Budget

-- ============================================================
-- 1. DARPA Opportunities (reuses SAM.gov API pattern)
-- ============================================================
CREATE TABLE IF NOT EXISTS darpa_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitation_number TEXT,
  title TEXT NOT NULL,
  agency TEXT,
  description TEXT,
  naics_code TEXT,
  psc_code TEXT,
  posted_date TEXT,
  response_deadline TEXT,
  opportunity_type TEXT,
  set_aside_type TEXT,
  place_of_performance TEXT,
  sam_gov_url TEXT,
  estimated_value NUMERIC,
  active BOOLEAN DEFAULT true,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE darpa_opportunities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view darpa_opportunities"
    ON darpa_opportunities FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_darpa_opportunities_sol ON darpa_opportunities(solicitation_number);
CREATE INDEX IF NOT EXISTS idx_darpa_opportunities_posted ON darpa_opportunities(posted_date DESC);

-- ============================================================
-- 2. UCS Satellite Database
-- ============================================================
CREATE TABLE IF NOT EXISTS ucs_satellites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT,
  operator TEXT,
  purpose TEXT,
  orbit_class TEXT,
  launch_date TEXT,
  launch_site TEXT,
  contractor TEXT,
  orbit_type TEXT,
  perigee_km NUMERIC,
  apogee_km NUMERIC,
  period_minutes NUMERIC,
  launch_mass_kg NUMERIC,
  norad_id TEXT,
  source_url TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ucs_satellites ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view ucs_satellites"
    ON ucs_satellites FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_ucs_satellites_name ON ucs_satellites(name);
CREATE INDEX IF NOT EXISTS idx_ucs_satellites_country ON ucs_satellites(country);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ucs_satellites_norad ON ucs_satellites(norad_id);

-- ============================================================
-- 3. CSIS Aerospace Security
-- ============================================================
CREATE TABLE IF NOT EXISTS csis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE,
  author TEXT,
  published_at TIMESTAMPTZ,
  category TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE csis_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view csis_reports"
    ON csis_reports FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_csis_reports_published ON csis_reports(published_at DESC);

-- ============================================================
-- 4. Defense Innovation Unit
-- ============================================================
CREATE TABLE IF NOT EXISTS diu_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE,
  focus_area TEXT,
  status TEXT,
  published_at TIMESTAMPTZ,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE diu_projects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view diu_projects"
    ON diu_projects FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_diu_projects_published ON diu_projects(published_at DESC);

-- ============================================================
-- 5. Bryce Tech Reports
-- ============================================================
CREATE TABLE IF NOT EXISTS bryce_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE,
  report_type TEXT,
  published_at TIMESTAMPTZ,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bryce_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view bryce_reports"
    ON bryce_reports FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_bryce_reports_published ON bryce_reports(published_at DESC);

-- ============================================================
-- 6. Space Capital Quarterly
-- ============================================================
CREATE TABLE IF NOT EXISTS space_capital_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE,
  quarter TEXT,
  year INTEGER,
  published_at TIMESTAMPTZ,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE space_capital_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view space_capital_reports"
    ON space_capital_reports FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_space_capital_published ON space_capital_reports(published_at DESC);

-- ============================================================
-- 7. SIA Resources
-- ============================================================
CREATE TABLE IF NOT EXISTS sia_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE,
  resource_type TEXT,
  published_at TIMESTAMPTZ,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sia_resources ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view sia_resources"
    ON sia_resources FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_sia_resources_published ON sia_resources(published_at DESC);

-- ============================================================
-- 8. NATO Procurement
-- ============================================================
CREATE TABLE IF NOT EXISTS nato_procurement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE,
  reference_number TEXT,
  procurement_type TEXT,
  deadline TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE nato_procurement ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view nato_procurement"
    ON nato_procurement FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_nato_procurement_published ON nato_procurement(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_nato_procurement_deadline ON nato_procurement(deadline DESC);

-- ============================================================
-- 9. ESA Copernicus (stub)
-- ============================================================
CREATE TABLE IF NOT EXISTS esa_copernicus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE,
  dataset TEXT,
  satellite TEXT,
  published_at TIMESTAMPTZ,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE esa_copernicus ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view esa_copernicus"
    ON esa_copernicus FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_esa_copernicus_published ON esa_copernicus(published_at DESC);

-- ============================================================
-- 10. ITU BRIFIC
-- ============================================================
CREATE TABLE IF NOT EXISTS itu_brific (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE,
  frequency_band TEXT,
  administration TEXT,
  service_type TEXT,
  published_at TIMESTAMPTZ,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE itu_brific ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view itu_brific"
    ON itu_brific FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_itu_brific_published ON itu_brific(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_itu_brific_freq ON itu_brific(frequency_band);

-- ============================================================
-- 11. Congressional Space Budget
-- ============================================================
CREATE TABLE IF NOT EXISTS congressional_space_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE,
  fiscal_year INTEGER,
  agency TEXT,
  amount_millions NUMERIC,
  budget_type TEXT,
  published_at TIMESTAMPTZ,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE congressional_space_budget ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view congressional_space_budget"
    ON congressional_space_budget FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_congress_budget_fy ON congressional_space_budget(fiscal_year DESC);
CREATE INDEX IF NOT EXISTS idx_congress_budget_published ON congressional_space_budget(published_at DESC);
