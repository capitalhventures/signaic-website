-- =============================================================================
-- Session C: News table for aggregated space/defense news
-- =============================================================================

CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  source_name TEXT,
  author TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns if they don't exist (table may have been created externally)
ALTER TABLE news ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE news ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE news ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Index for fast lookups (non-unique — existing data has duplicates)
CREATE INDEX IF NOT EXISTS idx_news_url ON news(url);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'news' AND policyname = 'Authenticated users can read news'
  ) THEN
    CREATE POLICY "Authenticated users can read news"
      ON news FOR SELECT TO authenticated USING (true);
  END IF;
END
$$;
