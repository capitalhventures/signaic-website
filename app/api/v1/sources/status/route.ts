import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

interface SourceStatus {
  name: string;
  table: string;
  lastRefresh: string | null;
  recordCount: number;
  status: "green" | "yellow" | "red";
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`sources:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const supabase = createClient();

    const sources = [
      { name: "FCC Filings", table: "fcc_filings" },
      { name: "SEC Filings", table: "sec_filings" },
      { name: "Patents", table: "patents" },
      { name: "Government Contracts", table: "contracts" },
      { name: "Orbital Data", table: "orbital_data" },
      { name: "News", table: "news" },
      { name: "Entities", table: "entities" },
      { name: "Federal Register", table: "federal_register" },
      { name: "SAM.gov Opportunities", table: "sam_opportunities" },
      { name: "SBIR/STTR Awards", table: "sbir_awards" },
    ];

    const statuses: SourceStatus[] = [];

    for (const source of sources) {
      try {
        const { count } = await supabase
          .from(source.table)
          .select("*", { count: "exact", head: true });

        // Try to get the most recent record's created_at
        const { data: latest } = await supabase
          .from(source.table)
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const lastRefresh = latest?.created_at || null;
        const hoursAgo = lastRefresh
          ? (Date.now() - new Date(lastRefresh).getTime()) / (1000 * 60 * 60)
          : Infinity;

        statuses.push({
          name: source.name,
          table: source.table,
          lastRefresh,
          recordCount: count || 0,
          status: hoursAgo < 24 ? "green" : hoursAgo < 72 ? "yellow" : "red",
        });
      } catch {
        statuses.push({
          name: source.name,
          table: source.table,
          lastRefresh: null,
          recordCount: 0,
          status: "red",
        });
      }
    }

    const totalEntities = statuses.find((s) => s.table === "entities")?.recordCount || 0;
    const totalDocuments = statuses.reduce((acc, s) => acc + s.recordCount, 0) - totalEntities;

    return apiResponse({
      sources: statuses,
      summary: {
        totalEntities,
        totalDocuments,
        lastGlobalRefresh: new Date().toISOString(),
      },
    });
  } catch {
    return apiError("Internal server error", 500);
  }
}
