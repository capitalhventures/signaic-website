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
    .select("id, filing_type, filed_date, accession_number, cik, description, document_url, companies:company_id(id, name)")
    .not("filing_type", "is", null)
    .order("filed_date", { ascending: false })
    .limit(500) as { data: Array<{ id: string; filing_type: string | null; filed_date: string | null; accession_number: string | null; cik: string | null; description: string | null; document_url: string | null; companies: { id: string; name: string } | null }> | null };

  return <SecFilingsClient filings={filings || []} />;
}
