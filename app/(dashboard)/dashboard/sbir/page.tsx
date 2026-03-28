import { createClient } from "@/lib/supabase/server";
import { SbirClient } from "@/components/sbir-client";

export const metadata = {
  title: "SBIR/STTR Awards | Signaic",
  description: "Small business innovation research and technology transfer awards.",
};

export default async function SbirPage() {
  const supabase = createClient();
  const { data: awards, error } = await supabase
    .from("sbir_awards")
    .select("*")
    .order("award_year", { ascending: false })
    .limit(500);

  return <SbirClient awards={awards || []} error={error?.message} />;
}
