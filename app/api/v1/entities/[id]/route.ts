import { NextRequest } from "next/server";
import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`entity:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const supabase = createClient();

    // Support lookup by UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    const query = isUuid
      ? supabase.from("entities").select("*").eq("id", params.id).single()
      : supabase.from("entities").select("*").eq("slug", params.id).single();

    const { data: entity, error } = await query;

    if (error || !entity) return apiError("Entity not found", 404);

    return apiResponse(entity);
  } catch {
    return apiError("Internal server error", 500);
  }
}
