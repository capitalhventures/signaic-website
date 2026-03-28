import { createClient } from "@/lib/supabase/server";
import { PatentsClient } from "@/components/patents-client";

export const metadata = {
  title: "Patents | Signaic",
  description: "Space & defense patent filings from USPTO.",
};

export default async function PatentsPage() {
  const supabase = createClient();
  const { data: patents } = await supabase
    .from("patents")
    .select("*, companies:company_id(id, name)")
    .order("filing_date", { ascending: false })
    .limit(200);

  return <PatentsClient patents={patents || []} />;
}
