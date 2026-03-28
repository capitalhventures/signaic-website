import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error) return apiResponse([]);

    return apiResponse(data || []);
  } catch {
    return apiError("Internal server error", 500);
  }
}
