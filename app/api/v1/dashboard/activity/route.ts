import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  source: string;
  created_at: string;
  url?: string;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`dashboard-activity:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const supabase = createClient();
    const activities: ActivityItem[] = [];

    // Fetch recent items from each source table
    const sourceQueries = [
      {
        table: "fcc_filings",
        type: "fcc",
        source: "FCC",
        titleCol: "title",
        select: "id, title, created_at",
      },
      {
        table: "contracts",
        type: "contract",
        source: "SAM.gov",
        titleCol: "title",
        select: "id, title, created_at",
      },
      {
        table: "patents",
        type: "patent",
        source: "USPTO",
        titleCol: "title",
        select: "id, title, created_at",
      },
      {
        table: "news",
        type: "news",
        source: "News",
        titleCol: "title",
        select: "id, title, published_at, url",
      },
      {
        table: "sec_filings",
        type: "sec",
        source: "SEC EDGAR",
        titleCol: "title",
        select: "id, title, created_at",
      },
      {
        table: "federal_register",
        type: "federal_register",
        source: "Federal Register",
        titleCol: "title",
        select: "id, title, created_at",
      },
    ];

    for (const sq of sourceQueries) {
      try {
        const dateCol = sq.table === "news" ? "published_at" : "created_at";
        const { data } = await supabase
          .from(sq.table)
          .select(sq.select)
          .order(dateCol, { ascending: false })
          .limit(5);

        if (data) {
          for (const item of data) {
            const row = item as unknown as Record<string, string>;
            activities.push({
              id: row.id || "",
              type: sq.type,
              title: row[sq.titleCol] || `${sq.source} record`,
              source: sq.source,
              created_at: row[dateCol] || row.created_at || "",
              url: row.url,
            });
          }
        }
      } catch {
        // Table may not exist
      }
    }

    // Sort by date, most recent first
    activities.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Return top 10
    return apiResponse(activities.slice(0, 10));
  } catch {
    return apiError("Internal server error", 500);
  }
}
