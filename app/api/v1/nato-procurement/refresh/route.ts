import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const admin = createAdminClient();
    const { count } = await admin.from("nato_procurement").select("*", { count: "exact", head: true });

    return apiResponse({
      source: "nato_procurement",
      record_count: count || 0,
      refreshed_at: new Date().toISOString(),
      note: "Stub - NSPA site unreachable from cloud. Manual ingestion required.",
    });
  } catch {
    return apiError("Failed to check NATO procurement data", 500);
  }
}
