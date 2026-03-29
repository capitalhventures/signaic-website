import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const admin = createAdminClient();
    const { count } = await admin.from("bryce_reports").select("*", { count: "exact", head: true });

    return apiResponse({
      source: "bryce_reports",
      record_count: count || 0,
      refreshed_at: new Date().toISOString(),
      note: "Stub - no public API available. Manual ingestion required.",
    });
  } catch {
    return apiError("Failed to check Bryce Tech data", 500);
  }
}
