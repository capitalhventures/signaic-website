-- Admin users table for role-based access control
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'superadmin')) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can check if they are admin (needed for client-side gating)
CREATE POLICY "Authenticated users can check own admin status"
  ON admin_users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seed admin users
INSERT INTO admin_users (email, role) VALUES
  ('ryan@capitalh.io', 'superadmin'),
  ('ryan@signaic.com', 'superadmin')
ON CONFLICT (email) DO NOTHING;
