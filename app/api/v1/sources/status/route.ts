import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

interface SourceStatus {
  name: string;
  table: string;
  lastRefresh: string | null;
  lastUpdated: string | null;
  recordCount: number;
  totalRows: number;
  status: "green" | "yellow" | "red" | "coming_soon";
  hoursSinceUpdate: number | null;
  expectedRefreshHours: number;
  message: string;
}

const expectedRefreshMap: Record<string, number> = {
  fcc_filings: 6,
  sec_filings: 12,
  patents: 24,
  contracts: 6,
  orbital_data: 2,
  news: 1,
  federal_register: 24,
  sbir_awards: 24,
  sam_opportunities: 6,
  entities: 168,
  daily_briefings: 24,
};

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`sources:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const supabase = createAdminClient();

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
      { name: "Daily Briefings", table: "daily_briefings" },
    ];

    const statuses: SourceStatus[] = [];

    for (const source of sources) {
      try {
        const { count, error: countError } = await supabase
          .from(source.table)
          .select("*", { count: "exact", head: true });

        if (countError) {
          // Table doesn't exist or is inaccessible
          statuses.push({
            name: source.name,
            table: source.table,
            lastRefresh: null,
            lastUpdated: null,
            recordCount: 0,
            totalRows: 0,
            status: "coming_soon",
            hoursSinceUpdate: null,
            expectedRefreshHours: expectedRefreshMap[source.table] || 24,
            message: "Coming soon",
          });
          continue;
        }

        const totalRows = count || 0;
        const expectedRefreshHours = expectedRefreshMap[source.table] || 24;

        if (totalRows === 0) {
          statuses.push({
            name: source.name,
            table: source.table,
            lastRefresh: null,
            lastUpdated: null,
            recordCount: 0,
            totalRows: 0,
            status: "red",
            hoursSinceUpdate: null,
            expectedRefreshHours,
            message: "Table is empty",
          });
          continue;
        }

        const { data: latest } = await supabase
          .from(source.table)
          .select("created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const lastRefresh = latest?.updated_at || latest?.created_at || null;
        const hoursSinceUpdate = lastRefresh
          ? (Date.now() - new Date(lastRefresh).getTime()) / (1000 * 60 * 60)
          : null;

        let status: "green" | "yellow" | "red";
        let message: string;

        if (hoursSinceUpdate === null) {
          status = "yellow";
          message = "Could not determine last update time";
        } else if (hoursSinceUpdate <= expectedRefreshHours) {
          status = "green";
          message = `Updated ${hoursSinceUpdate.toFixed(1)}h ago`;
        } else if (hoursSinceUpdate <= expectedRefreshHours * 3) {
          status = "yellow";
          message = `Stale: ${hoursSinceUpdate.toFixed(1)}h since last update`;
        } else {
          status = "red";
          message = `Critical: ${hoursSinceUpdate.toFixed(1)}h since last update`;
        }

        statuses.push({
          name: source.name,
          table: source.table,
          lastRefresh,
          lastUpdated: lastRefresh,
          recordCount: totalRows,
          totalRows,
          status,
          hoursSinceUpdate: hoursSinceUpdate ? Math.round(hoursSinceUpdate * 10) / 10 : null,
          expectedRefreshHours,
          message,
        });
      } catch {
        statuses.push({
          name: source.name,
          table: source.table,
          lastRefresh: null,
          lastUpdated: null,
          recordCount: 0,
          totalRows: 0,
          status: "coming_soon",
          hoursSinceUpdate: null,
          expectedRefreshHours: expectedRefreshMap[source.table] || 24,
          message: "Coming soon",
        });
      }
    }

    // Get Sentinel's last health check timestamp
    let sentinelLastCheck: string | null = null;
    try {
      const { data: lastLog } = await supabase
        .from("agent_logs")
        .select("created_at")
        .eq("agent_name", "sentinel")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      sentinelLastCheck = lastLog?.created_at || null;
    } catch {
      // agent_logs may not exist yet
    }

    const totalEntities = statuses.find((s) => s.table === "entities")?.recordCount || 0;
    const totalDocuments = statuses.reduce((acc, s) => acc + s.recordCount, 0) - totalEntities;

    return apiResponse({
      sources: statuses,
      sentinel_last_check: sentinelLastCheck,
      summary: {
        totalEntities,
        totalDocuments,
        total: statuses.length,
        green: statuses.filter((s) => s.status === "green").length,
        yellow: statuses.filter((s) => s.status === "yellow").length,
        red: statuses.filter((s) => s.status === "red").length,
        coming_soon: statuses.filter((s) => s.status === "coming_soon").length,
        lastGlobalRefresh: new Date().toISOString(),
      },
    });
  } catch {
    return apiError("Internal server error", 500);
  }
}
