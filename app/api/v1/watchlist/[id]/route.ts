import { NextRequest } from "next/server";
import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`watchlist:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("watchlist")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) return apiError("Failed to remove from watchlist", 500);

    return apiResponse({ deleted: true });
  } catch {
    return apiError("Internal server error", 500);
  }
}
