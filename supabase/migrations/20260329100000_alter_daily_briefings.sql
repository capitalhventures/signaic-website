-- Extend daily_briefings table with full briefing content columns
ALTER TABLE daily_briefings
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS sectors_covered TEXT[],
  ADD COLUMN IF NOT EXISTS source_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS key_developments JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Index for listing briefings by date
CREATE INDEX IF NOT EXISTS idx_daily_briefings_created_at ON daily_briefings(created_at DESC);
