import { NextRequest } from "next/server";
import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`entity:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const supabase = createClient();
    const { data: entity, error } = await supabase
      .from("entities")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !entity) return apiError("Entity not found", 404);

    // Get source counts from related tables
    const sourceTables = [
      { table: "fcc_filings", label: "FCC Filings" },
      { table: "sec_filings", label: "SEC Filings" },
      { table: "patents", label: "Patents" },
      { table: "contracts", label: "Government Contracts" },
      { table: "orbital_data", label: "Orbital Assets" },
      { table: "news", label: "News" },
      { table: "federal_register", label: "Federal Register" },
      { table: "sbir_awards", label: "SBIR/STTR" },
      { table: "sam_opportunities", label: "SAM.gov" },
    ];

    const sourceCounts: Record<string, number> = {};
    for (const source of sourceTables) {
      const { count } = await supabase
        .from(source.table)
        .select("*", { count: "exact", head: true })
        .eq("entity_id", entity.id);
      sourceCounts[source.label] = count || 0;
    }

    return apiResponse({
      ...entity,
      source_counts: sourceCounts,
    });
  } catch {
    return apiError("Internal server error", 500);
  }
}
