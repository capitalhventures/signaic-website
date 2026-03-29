import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  try {
    // Space Capital does not expose an RSS feed or public API.
    await logCronExecution("space_capital", "skipped", 0, "No public API available - stub endpoint");
    return cronSuccess({ source: "space_capital", inserted: 0, note: "Stub - no public API or RSS feed available" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("space_capital", "error", 0, message);
    return cronError("Failed to refresh Space Capital reports");
  }
}
