-- Add enrichment columns to entities table for detailed entity profiles
-- Idempotent: uses IF NOT EXISTS / safe ADD COLUMN pattern

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entities' AND column_name = 'website') THEN
    ALTER TABLE entities ADD COLUMN website TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entities' AND column_name = 'ticker_symbol') THEN
    ALTER TABLE entities ADD COLUMN ticker_symbol TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entities' AND column_name = 'headquarters') THEN
    ALTER TABLE entities ADD COLUMN headquarters TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entities' AND column_name = 'key_programs') THEN
    ALTER TABLE entities ADD COLUMN key_programs TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entities' AND column_name = 'founded_year') THEN
    ALTER TABLE entities ADD COLUMN founded_year INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entities' AND column_name = 'employee_count_estimate') THEN
    ALTER TABLE entities ADD COLUMN employee_count_estimate INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entities' AND column_name = 'annual_revenue_estimate') THEN
    ALTER TABLE entities ADD COLUMN annual_revenue_estimate TEXT;
  END IF;
END $$;
