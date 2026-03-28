import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

const REQUIRED_KEYS = [
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "NEWSAPI_KEY",
  "SAM_GOV_API_KEY",
  "SPACE_TRACK_USERNAME",
  "SPACE_TRACK_PASSWORD",
  "RESEND_API_KEY",
  "N8N_API_KEY",
  "N8N_BASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export async function GET() {
  const user = await getAuthUser();
  if (!user || !user.email) return apiError("Unauthorized", 401);
  if (!(await isAdmin(user.email))) return apiError("Forbidden", 403);

  // Check env var presence (never expose values)
  const envStatus: Record<string, "present" | "missing"> = {};
  for (const key of REQUIRED_KEYS) {
    envStatus[key] = process.env[key] ? "present" : "missing";
  }

  // Test Supabase connectivity
  let supabaseStatus: "connected" | "error" = "error";
  const tableCheck: Record<string, number> = {};
  try {
    const supabase = createAdminClient();

    // Basic connectivity test
    const { error } = await supabase.from("entities").select("id").limit(1);
    if (!error) {
      supabaseStatus = "connected";
    }

    // Count rows in key tables
    const tables = ["entities", "conversations", "messages", "embeddings", "news", "daily_briefings"];
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });
        tableCheck[table] = count ?? 0;
      } catch {
        tableCheck[table] = -1; // table may not exist
      }
    }
  } catch {
    supabaseStatus = "error";
  }

  return apiResponse({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: envStatus,
    supabase: {
      status: supabaseStatus,
      tables: tableCheck,
    },
  });
}
