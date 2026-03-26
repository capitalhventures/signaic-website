import { NextRequest } from "next/server";
import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`entities:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const sector = searchParams.get("sector") || "";

    const supabase = createClient();
    let query = supabase.from("entities").select("*", { count: "exact" });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    if (type) {
      query = query.eq("type", type);
    }
    if (sector) {
      query = query.contains("sectors", [sector]);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order("name");

    const { data: entities, count, error } = await query;

    if (error) return apiError("Failed to fetch entities", 500);

    return apiResponse({
      entities: entities || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch {
    return apiError("Internal server error", 500);
  }
}
