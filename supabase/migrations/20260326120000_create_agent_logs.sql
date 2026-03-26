-- Agent logs table for tracking agent runs
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name TEXT NOT NULL,
  run_type TEXT NOT NULL,
  status TEXT CHECK (status IN ('success', 'warning', 'error')),
  summary TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view agent logs
CREATE POLICY "Authenticated users can view agent logs"
  ON agent_logs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create index for querying by agent name and time
CREATE INDEX idx_agent_logs_agent_name ON agent_logs(agent_name);
CREATE INDEX idx_agent_logs_created_at ON agent_logs(created_at DESC);

-- Add unique constraint on briefing_date for daily_briefings (for upsert)
-- Only add if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'daily_briefings_briefing_date_key'
  ) THEN
    ALTER TABLE daily_briefings ADD CONSTRAINT daily_briefings_briefing_date_key UNIQUE (briefing_date);
  END IF;
END $$;
