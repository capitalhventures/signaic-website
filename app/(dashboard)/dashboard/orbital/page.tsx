import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrbitalDataClient } from "@/components/orbital-data-client";
import { getAuthUser, isAdmin } from "@/lib/admin";

export const metadata = {
  title: "Orbital Data | Signaic",
  description: "Tracked objects from Space-Track.org.",
};

export default async function OrbitalPage() {
  const supabase = createClient();
  const admin = createAdminClient();
  const { data: objects } = await supabase
    .from("orbital_data")
    .select("*, companies:company_id(id, name)")
    .order("launch_date", { ascending: false })
    .limit(500);

  const { data: latest } = await admin
    .from("orbital_data")
    .select("updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const user = await getAuthUser();
  const userIsAdmin = user?.email ? await isAdmin(user.email) : false;

  return (
    <OrbitalDataClient
      objects={objects || []}
      isAdmin={userIsAdmin}
      lastRefreshed={latest?.updated_at || null}
    />
  );
}
