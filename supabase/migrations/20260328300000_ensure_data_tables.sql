-- Ensure data source tables exist for API refresh endpoints

-- SAM.gov Opportunities
CREATE TABLE IF NOT EXISTS sam_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitation_number TEXT,
  title TEXT NOT NULL,
  agency TEXT,
  description TEXT,
  estimated_value NUMERIC,
  set_aside_type TEXT,
  response_deadline TIMESTAMPTZ,
  place_of_performance TEXT,
  naics_code TEXT,
  psc_code TEXT,
  sam_gov_url TEXT,
  posted_date TIMESTAMPTZ,
  opportunity_type TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sam_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sam_opportunities"
  ON sam_opportunities FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_sam_opp_solicitation ON sam_opportunities(solicitation_number);
CREATE INDEX IF NOT EXISTS idx_sam_opp_naics ON sam_opportunities(naics_code);
CREATE INDEX IF NOT EXISTS idx_sam_opp_posted ON sam_opportunities(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_sam_opp_deadline ON sam_opportunities(response_deadline ASC);

-- Orbital Data
CREATE TABLE IF NOT EXISTS orbital_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  norad_cat_id TEXT UNIQUE,
  object_name TEXT,
  company_id UUID REFERENCES entities(id),
  object_type TEXT,
  orbit_type TEXT,
  launch_date TEXT,
  period NUMERIC,
  inclination NUMERIC,
  apoapsis NUMERIC,
  periapsis NUMERIC,
  current_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE orbital_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view orbital_data"
  ON orbital_data FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_orbital_norad ON orbital_data(norad_cat_id);
CREATE INDEX IF NOT EXISTS idx_orbital_orbit_type ON orbital_data(orbit_type);
CREATE INDEX IF NOT EXISTS idx_orbital_launch ON orbital_data(launch_date DESC);

-- News (may already exist from earlier migration)
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  url TEXT,
  source_name TEXT,
  source TEXT,
  author TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  published_date TIMESTAMPTZ,
  summary TEXT,
  sentiment TEXT,
  category TEXT,
  company_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Other data tables referenced in sources status
CREATE TABLE IF NOT EXISTS fcc_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  filing_type TEXT,
  bureau TEXT,
  entity_id UUID,
  description TEXT,
  filing_date TIMESTAMPTZ,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sec_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  form_type TEXT,
  company_name TEXT,
  entity_id UUID,
  filing_date TIMESTAMPTZ,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  patent_number TEXT,
  assignee TEXT,
  entity_id UUID,
  filing_date TIMESTAMPTZ,
  grant_date TIMESTAMPTZ,
  abstract TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  agency TEXT,
  contractor TEXT,
  entity_id UUID,
  award_amount NUMERIC,
  award_date TIMESTAMPTZ,
  description TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS federal_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  document_number TEXT,
  agency TEXT,
  document_type TEXT,
  publication_date TIMESTAMPTZ,
  abstract TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sbir_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  agency TEXT,
  firm TEXT,
  entity_id UUID,
  award_amount NUMERIC,
  award_year TEXT,
  phase TEXT,
  abstract TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
DO $$
BEGIN
  ALTER TABLE fcc_filings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE sec_filings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE patents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE federal_register ENABLE ROW LEVEL SECURITY;
  ALTER TABLE sbir_awards ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- RLS policies for authenticated read access
DO $$
BEGIN
  CREATE POLICY "Authenticated users can view fcc_filings" ON fcc_filings FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view sec_filings" ON sec_filings FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view patents" ON patents FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view contracts" ON contracts FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view federal_register" ON federal_register FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Authenticated users can view sbir_awards" ON sbir_awards FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
