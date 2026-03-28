-- Add user_id and other columns to existing alerts table if they don't exist
DO $$
BEGIN
  -- Add user_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'user_id' AND table_schema = 'public') THEN
    ALTER TABLE public.alerts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add entity_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'entity_id' AND table_schema = 'public') THEN
    ALTER TABLE public.alerts ADD COLUMN entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL;
  END IF;

  -- Add alert_type if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'alert_type' AND table_schema = 'public') THEN
    ALTER TABLE public.alerts ADD COLUMN alert_type TEXT NOT NULL DEFAULT 'general';
  END IF;

  -- Add severity if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'severity' AND table_schema = 'public') THEN
    ALTER TABLE public.alerts ADD COLUMN severity TEXT NOT NULL DEFAULT 'medium';
  END IF;

  -- Add title if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'title' AND table_schema = 'public') THEN
    ALTER TABLE public.alerts ADD COLUMN title TEXT NOT NULL DEFAULT '';
  END IF;

  -- Add description if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'description' AND table_schema = 'public') THEN
    ALTER TABLE public.alerts ADD COLUMN description TEXT;
  END IF;

  -- Add source_type if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'source_type' AND table_schema = 'public') THEN
    ALTER TABLE public.alerts ADD COLUMN source_type TEXT;
  END IF;

  -- Add source_id if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'source_id' AND table_schema = 'public') THEN
    ALTER TABLE public.alerts ADD COLUMN source_id TEXT;
  END IF;

  -- Add source_url if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'source_url' AND table_schema = 'public') THEN
    ALTER TABLE public.alerts ADD COLUMN source_url TEXT;
  END IF;

  -- Add read if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'read' AND table_schema = 'public') THEN
    ALTER TABLE public.alerts ADD COLUMN read BOOLEAN DEFAULT false;
  END IF;

  -- Add created_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'created_at' AND table_schema = 'public') THEN
    ALTER TABLE public.alerts ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'updated_at' AND table_schema = 'public') THEN
    ALTER TABLE public.alerts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Enable RLS on alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop first if they exist)
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.alerts;
CREATE POLICY "Users can view their own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own alerts" ON public.alerts;
CREATE POLICY "Users can update their own alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes (if not exist)
CREATE INDEX IF NOT EXISTS idx_alerts_user_created ON public.alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON public.alerts(user_id, read);

-- Create user dashboard preferences table
CREATE TABLE IF NOT EXISTS public.user_dashboard_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  visible BOOLEAN DEFAULT true,
  position INTEGER,
  width TEXT DEFAULT 'full',
  height TEXT DEFAULT 'auto',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, section_key)
);

ALTER TABLE public.user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own dashboard preferences" ON public.user_dashboard_preferences;
CREATE POLICY "Users can manage their own dashboard preferences" ON public.user_dashboard_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_prefs_user ON public.user_dashboard_preferences(user_id);
