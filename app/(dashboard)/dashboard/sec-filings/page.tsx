import { createAdminClient } from "@/lib/supabase/admin";
import { SecFilingsClient } from "@/components/sec-filings-client";

export const metadata = {
  title: "SEC Filings | Signaic",
  description: "SEC EDGAR filings from public space & defense companies.",
};

export default async function SecFilingsPage() {
  const supabase = createAdminClient();
  const { data: filings } = await supabase
    .from("sec_filings")
    .select("*, companies:company_id(id, name)")
    .not("filing_type", "is", null)
    .order("filed_date", { ascending: false })
    .limit(500);

  return <SecFilingsClient filings={filings || []} />;
}
