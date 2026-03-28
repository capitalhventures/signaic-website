import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`dashboard-alerts:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("alerts")
      .select(`
        id,
        alert_type,
        severity,
        title,
        description,
        source_type,
        source_url,
        read,
        created_at,
        entity_id,
        entities (
          id,
          name,
          slug,
          type
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      // Table may not exist yet — return empty
      return apiResponse([]);
    }

    return apiResponse(data || []);
  } catch {
    return apiError("Internal server error", 500);
  }
}
