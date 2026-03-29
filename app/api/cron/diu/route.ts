import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  try {
    // DIU does not expose an RSS feed or public API.
    // Stub: log execution and return success with 0 records.
    await logCronExecution("diu", "skipped", 0, "No public API available - stub endpoint");
    return cronSuccess({ source: "diu", inserted: 0, note: "Stub - no public API or RSS feed available" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("diu", "error", 0, message);
    return cronError("Failed to refresh DIU projects");
  }
}
