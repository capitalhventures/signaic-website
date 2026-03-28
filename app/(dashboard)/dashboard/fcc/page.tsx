import { createClient } from "@/lib/supabase/server";
import { FccFilingsClient } from "@/components/fcc-filings-client";

export const metadata = {
  title: "FCC Filings | Signaic",
  description: "Federal Communications Commission satellite filings.",
};

export default async function FccPage() {
  const supabase = createClient();
  const { data: filings } = await supabase
    .from("fcc_filings")
    .select("*, companies:company_id(id, name)")
    .order("filing_date", { ascending: false })
    .limit(200);

  return <FccFilingsClient filings={filings || []} />;
}
