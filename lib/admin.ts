import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Admin email whitelist — checked against Supabase auth user email
// This is the source of truth for admin access. The admin_users table
// is used for metadata (role, created_at) but this list gates access.
const ADMIN_EMAILS = [
  "ryan@capitalh.io",
  "ryan@signaic.com",
  "ryanjhasty@gmail.com",
];

export async function getAuthUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function isAdmin(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export async function requireAdmin(): Promise<{
  id: string;
  email: string;
}> {
  const user = await getAuthUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  if (!(await isAdmin(user.email))) {
    redirect("/dashboard");
  }

  return { id: user.id, email: user.email };
}
