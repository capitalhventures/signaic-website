-- Cron job execution log table
CREATE TABLE IF NOT EXISTS cron_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cron_logs_source ON cron_logs (source);
CREATE INDEX idx_cron_logs_executed_at ON cron_logs (executed_at DESC);
CREATE INDEX idx_cron_logs_source_executed ON cron_logs (source, executed_at DESC);

ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cron logs"
  ON cron_logs FOR SELECT
  TO authenticated
  USING (true);
