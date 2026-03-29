import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  try {
    // NATO NSPA does not expose a public API or RSS feed.
    await logCronExecution("nato_procurement", "skipped", 0, "No public API available - stub endpoint");
    return cronSuccess({ source: "nato_procurement", inserted: 0, note: "Stub - no public API or RSS feed available" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("nato_procurement", "error", 0, message);
    return cronError("Failed to refresh NATO procurement");
  }
}
