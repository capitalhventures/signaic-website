import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SamOpportunitiesClient } from "@/components/sam-opportunities-client";
import { getAuthUser, isAdmin } from "@/lib/admin";

export const metadata = {
  title: "SAM.gov Opportunities | Signaic",
  description: "Active contract opportunities from SAM.gov.",
};

export default async function SamOpportunitiesPage() {
  const supabase = createClient();
  const admin = createAdminClient();
  const { data: opportunities, error } = await supabase
    .from("sam_opportunities")
    .select("*")
    .eq("active", true)
    .order("response_deadline", { ascending: true })
    .limit(500);

  const { data: latest } = await admin
    .from("sam_opportunities")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const user = await getAuthUser();
  const userIsAdmin = user?.email ? await isAdmin(user.email) : false;

  return (
    <SamOpportunitiesClient
      opportunities={opportunities || []}
      error={error?.message}
      isAdmin={userIsAdmin}
      lastRefreshed={latest?.created_at || null}
    />
  );
}
