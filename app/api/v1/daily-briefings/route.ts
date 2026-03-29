import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`daily-briefings:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("daily_briefings")
      .select("id, title, summary, content, briefing_date, sectors_covered, source_count, key_developments, created_at")
      .order("briefing_date", { ascending: false })
      .limit(30);

    if (error) {
      return apiError("Failed to fetch briefings", 500);
    }

    return apiResponse(data || []);
  } catch {
    return apiError("Internal server error", 500);
  }
}
