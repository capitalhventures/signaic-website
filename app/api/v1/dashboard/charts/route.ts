import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

interface WeeklyActivity {
  week: string;
  fcc_filings: number;
  patents: number;
  contracts: number;
  news: number;
  sec_filings: number;
  federal_register: number;
}

interface SectorCount {
  sector: string;
  count: number;
}

interface TopEntity {
  name: string;
  slug: string;
  type: string;
  activity_count: number;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`dashboard-charts:${user.id}`, 30)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const supabase = createClient();
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    // === Activity Over 90 Days (by week, by source type) ===
    const activityTables = [
      { table: "fcc_filings", key: "fcc_filings", dateCol: "created_at" },
      { table: "patents", key: "patents", dateCol: "created_at" },
      { table: "contracts", key: "contracts", dateCol: "created_at" },
      { table: "news", key: "news", dateCol: "published_at" },
      { table: "sec_filings", key: "sec_filings", dateCol: "created_at" },
      { table: "federal_register", key: "federal_register", dateCol: "created_at" },
    ];

    // Build weekly buckets for the last 13 weeks
    const weeks: WeeklyActivity[] = [];
    for (let i = 12; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      weeks.push({
        week: weekStart.toISOString().split("T")[0],
        fcc_filings: 0,
        patents: 0,
        contracts: 0,
        news: 0,
        sec_filings: 0,
        federal_register: 0,
      });
    }

    for (const source of activityTables) {
      try {
        const { data } = await supabase
          .from(source.table)
          .select(source.dateCol)
          .gte(source.dateCol, ninetyDaysAgo)
          .order(source.dateCol, { ascending: true });

        if (data) {
          for (const item of data) {
            const row = item as unknown as Record<string, string>;
            const rowDate = new Date(row[source.dateCol]);
            // Find the week bucket
            for (let i = weeks.length - 1; i >= 0; i--) {
              if (rowDate >= new Date(weeks[i].week)) {
                weeks[i][source.key as keyof Omit<WeeklyActivity, "week">]++;
                break;
              }
            }
          }
        }
      } catch {
        // Table may not exist
      }
    }

    // === Sector Distribution ===
    const sectors: SectorCount[] = [];
    try {
      const { data: entities } = await supabase
        .from("entities")
        .select("sectors");

      if (entities) {
        const sectorMap = new Map<string, number>();
        for (const entity of entities) {
          if (entity.sectors && Array.isArray(entity.sectors)) {
            for (const sector of entity.sectors) {
              sectorMap.set(sector, (sectorMap.get(sector) || 0) + 1);
            }
          }
        }
        Array.from(sectorMap.entries()).forEach(([sector, count]) => {
          sectors.push({ sector, count });
        });
        sectors.sort((a, b) => b.count - a.count);
      }
    } catch {
      // entities table may not exist
    }

    // === Top Entities by Activity ===
    const topEntities: TopEntity[] = [];
    try {
      const { data: entities } = await supabase
        .from("entities")
        .select("name, slug, type, source_counts")
        .not("source_counts", "is", null)
        .limit(50);

      if (entities) {
        const scored = entities.map((e) => {
          const counts = e.source_counts || {};
          const total = Object.values(counts).reduce(
            (sum: number, val) => sum + (typeof val === "number" ? val : 0),
            0
          );
          return { name: e.name, slug: e.slug, type: e.type, activity_count: total };
        });
        scored.sort((a, b) => b.activity_count - a.activity_count);
        topEntities.push(...scored.slice(0, 10));
      }
    } catch {
      // entities table may not exist
    }

    // === Alert Severity Distribution ===
    const alertSeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    try {
      const { data: alerts } = await supabase
        .from("alerts")
        .select("severity")
        .eq("user_id", user.id);

      if (alerts) {
        for (const alert of alerts) {
          if (alert.severity in alertSeverity) {
            alertSeverity[alert.severity]++;
          }
        }
      }
    } catch {
      // alerts table may not exist
    }

    return apiResponse({
      weeklyActivity: weeks,
      sectorDistribution: sectors,
      topEntities,
      alertSeverity,
    });
  } catch {
    return apiError("Internal server error", 500);
  }
}
