import { NextRequest } from "next/server";
import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`watchlist:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("watchlist")
      .select(`
        id,
        created_at,
        entity_id,
        entities (
          id,
          name,
          slug,
          type,
          sectors
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return apiError("Failed to fetch watchlist", 500);

    return apiResponse(data || []);
  } catch {
    return apiError("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`watchlist:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const { entityId } = await request.json();
    if (!entityId) return apiError("entityId is required");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("watchlist")
      .insert({
        user_id: user.id,
        entity_id: entityId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return apiError("Entity already in watchlist", 409);
      }
      return apiError("Failed to add to watchlist", 500);
    }

    return apiResponse(data, 201);
  } catch {
    return apiError("Internal server error", 500);
  }
}
