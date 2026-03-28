import { createClient } from "@/lib/supabase/server";
import { OrbitalDataClient } from "@/components/orbital-data-client";

export const metadata = {
  title: "Orbital Data | Signaic",
  description: "Tracked objects from Space-Track.org.",
};

export default async function OrbitalPage() {
  const supabase = createClient();
  const { data: objects } = await supabase
    .from("orbital_data")
    .select("*, companies:company_id(id, name)")
    .order("launch_date", { ascending: false })
    .limit(500);

  return <OrbitalDataClient objects={objects || []} />;
}
