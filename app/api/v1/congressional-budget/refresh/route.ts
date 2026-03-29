import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const admin = createAdminClient();
    const { count } = await admin.from("congressional_space_budget").select("*", { count: "exact", head: true });

    return apiResponse({
      source: "congressional_space_budget",
      record_count: count || 0,
      refreshed_at: new Date().toISOString(),
      note: "Stub - manual data compilation from congressional records required.",
    });
  } catch {
    return apiError("Failed to check Congressional space budget data", 500);
  }
}
