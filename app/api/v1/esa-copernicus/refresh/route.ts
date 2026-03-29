import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const admin = createAdminClient();
    const { count } = await admin.from("esa_copernicus").select("*", { count: "exact", head: true });

    return apiResponse({
      source: "esa_copernicus",
      record_count: count || 0,
      refreshed_at: new Date().toISOString(),
      note: "Stub - ESA Copernicus API key registration required.",
    });
  } catch {
    return apiError("Failed to check ESA Copernicus data", 500);
  }
}
