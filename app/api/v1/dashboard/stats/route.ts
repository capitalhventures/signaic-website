import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`dashboard-stats:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const supabase = createClient();

    // Sources Active: count sources with recent data (green status)
    const sourceTables = [
      { table: "fcc_filings", expectedHours: 6 },
      { table: "sec_filings", expectedHours: 12 },
      { table: "patents", expectedHours: 24 },
      { table: "contracts", expectedHours: 6 },
      { table: "orbital_data", expectedHours: 2 },
      { table: "news", expectedHours: 1 },
      { table: "federal_register", expectedHours: 24 },
      { table: "sbir_awards", expectedHours: 24 },
      { table: "sam_opportunities", expectedHours: 6 },
    ];

    let sourcesActive = 0;
    let latestRefresh: string | null = null;

    for (const source of sourceTables) {
      try {
        const { count } = await supabase
          .from(source.table)
          .select("*", { count: "exact", head: true });

        if (count && count > 0) {
          sourcesActive++;

          const { data: latest } = await supabase
            .from(source.table)
            .select("created_at")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (latest?.created_at) {
            if (!latestRefresh || new Date(latest.created_at) > new Date(latestRefresh)) {
              latestRefresh = latest.created_at;
            }
          }
        }
      } catch {
        // Table may not exist — skip
      }
    }

    // New Alerts: count alerts since user's last sign in
    let newAlerts = 0;
    try {
      const lastSignIn = user.last_sign_in_at || user.created_at;
      const { count } = await supabase
        .from("alerts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", lastSignIn);
      newAlerts = count || 0;
    } catch {
      // alerts table may not exist yet
    }

    // Watchlist Updates: count new activity for watched entities since last login
    let watchlistUpdates = 0;
    try {
      const lastSignIn = user.last_sign_in_at || user.created_at;

      // Get user's watchlist entity IDs
      const { data: watchlist } = await supabase
        .from("watchlist")
        .select("entity_id")
        .eq("user_id", user.id);

      if (watchlist && watchlist.length > 0) {
        const entityIds = watchlist.map((w) => w.entity_id);

        // Check entities table for recent updates
        const { count } = await supabase
          .from("entities")
          .select("*", { count: "exact", head: true })
          .in("id", entityIds)
          .gte("updated_at", lastSignIn);

        watchlistUpdates = count || 0;
      }
    } catch {
      // watchlist table may not exist yet
    }

    // Calculate last refresh relative time
    let lastRefreshMinutes: number | null = null;
    if (latestRefresh) {
      lastRefreshMinutes = Math.round(
        (Date.now() - new Date(latestRefresh).getTime()) / (1000 * 60)
      );
    }

    return apiResponse({
      sourcesActive,
      totalSources: sourceTables.length,
      lastRefreshMinutes,
      lastRefreshAt: latestRefresh,
      newAlerts,
      watchlistUpdates,
    });
  } catch {
    return apiError("Internal server error", 500);
  }
}
