import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { EntityDetailClient } from "@/components/entity-detail-client";

export default async function EntityDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const identifier = params.slug;

  // Try to find by ID first (UUID), then fall back to slug
  let company = null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (uuidRegex.test(identifier)) {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("id", identifier)
      .single();
    company = data;
  }

  if (!company) {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("slug", identifier)
      .single();
    company = data;
  }

  if (!company) return notFound();

  const companyId = company.id;

  const [fccRes, orbitalRes, patentsRes, contractsRes, newsRes, secRes] = await Promise.all([
    supabase.from("fcc_filings").select("*").eq("company_id", companyId).order("filing_date", { ascending: false }).limit(50),
    supabase.from("orbital_data").select("*").eq("company_id", companyId).order("launch_date", { ascending: false }).limit(50),
    supabase.from("patents").select("*").eq("company_id", companyId).order("filing_date", { ascending: false }).limit(50),
    supabase.from("gov_contracts").select("*").eq("company_id", companyId).order("period_start", { ascending: false }).limit(50),
    supabase.from("news").select("*").eq("company_id", companyId).order("published_date", { ascending: false }).limit(50),
    supabase.from("sec_filings").select("*").eq("company_id", companyId).order("filed_date", { ascending: false }).limit(50),
  ]);

  return (
    <EntityDetailClient
      company={company}
      filings={fccRes.data || []}
      orbital={orbitalRes.data || []}
      patents={patentsRes.data || []}
      contracts={contractsRes.data || []}
      news={newsRes.data || []}
      secFilings={secRes.data || []}
    />
  );
}
