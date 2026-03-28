import { NextRequest } from "next/server";
import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_dashboard_preferences")
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true });

    if (error) {
      // Table may not exist yet — return empty
      return apiResponse([]);
    }

    return apiResponse(data || []);
  } catch {
    return apiError("Internal server error", 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`dashboard-prefs:${user.id}`, 30)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const { sections } = await request.json();
    if (!Array.isArray(sections)) return apiError("sections must be an array");

    const supabase = createClient();

    // Upsert all section preferences
    const upsertData = sections.map(
      (s: { key: string; visible: boolean; position: number; width?: string }) => ({
        user_id: user.id,
        section_key: s.key,
        visible: s.visible,
        position: s.position,
        width: s.width || "full",
        updated_at: new Date().toISOString(),
      })
    );

    const { error } = await supabase
      .from("user_dashboard_preferences")
      .upsert(upsertData, { onConflict: "user_id,section_key" });

    if (error) {
      return apiError("Failed to save preferences", 500);
    }

    return apiResponse({ saved: true });
  } catch {
    return apiError("Internal server error", 500);
  }
}
