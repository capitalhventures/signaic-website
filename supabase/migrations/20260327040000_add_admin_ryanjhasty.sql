-- Add ryanjhasty@gmail.com as superadmin (founder's Google OAuth login)
INSERT INTO admin_users (email, role) VALUES
  ('ryanjhasty@gmail.com', 'superadmin')
ON CONFLICT (email) DO NOTHING;
