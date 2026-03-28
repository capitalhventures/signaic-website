import { createClient } from "@/lib/supabase/server";
import { SamOpportunitiesClient } from "@/components/sam-opportunities-client";

export const metadata = {
  title: "SAM.gov Opportunities | Signaic",
  description: "Active contract opportunities from SAM.gov.",
};

export default async function SamOpportunitiesPage() {
  const supabase = createClient();
  const { data: opportunities, error } = await supabase
    .from("sam_opportunities")
    .select("*")
    .eq("active", true)
    .order("response_deadline", { ascending: true })
    .limit(500);

  return (
    <SamOpportunitiesClient
      opportunities={opportunities || []}
      error={error?.message}
    />
  );
}
