import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("briefs")
      .select("id, title, config, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) return apiResponse([]);

    return apiResponse(data || []);
  } catch {
    return apiError("Internal server error", 500);
  }
}
