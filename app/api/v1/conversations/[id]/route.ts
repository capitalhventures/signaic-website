import { NextRequest } from "next/server";
import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const supabase = createClient();

    // Verify the conversation belongs to the user
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (convError || !conv) return apiError("Conversation not found", 404);

    const { data: messages, error } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", params.id)
      .order("created_at", { ascending: true });

    if (error) return apiError("Failed to fetch messages", 500);

    return apiResponse(messages || []);
  } catch {
    return apiError("Internal server error", 500);
  }
}
