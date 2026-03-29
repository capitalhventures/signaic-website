import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  try {
    // Bryce Tech does not expose an RSS feed or public API.
    await logCronExecution("bryce_tech", "skipped", 0, "No public API available - stub endpoint");
    return cronSuccess({ source: "bryce_tech", inserted: 0, note: "Stub - no public API or RSS feed available" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("bryce_tech", "error", 0, message);
    return cronError("Failed to refresh Bryce Tech reports");
  }
}
