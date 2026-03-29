import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`ucs:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const admin = createAdminClient();

    const { count } = await admin
      .from("ucs_satellites")
      .select("*", { count: "exact", head: true });

    return apiResponse({
      source: "ucs_satellites",
      record_count: count || 0,
      refreshed_at: new Date().toISOString(),
      note: "Full refresh runs via monthly cron job",
    });
  } catch {
    return apiError("Failed to check UCS satellite data", 500);
  }
}
