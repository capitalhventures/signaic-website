-- Session E-7: RSS Feed Pipelines
-- Create rss_feeds table for 5 new RSS sources

CREATE TABLE IF NOT EXISTS rss_feeds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL UNIQUE,
  author TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  embedding VECTOR(1536)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rss_feeds_source ON rss_feeds (source);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_published_at ON rss_feeds (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_rss_feeds_source_published ON rss_feeds (source, published_at DESC);

-- Enable RLS
ALTER TABLE rss_feeds ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read rss_feeds"
  ON rss_feeds FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role full access (for cron inserts)
CREATE POLICY "Service role full access to rss_feeds"
  ON rss_feeds FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
