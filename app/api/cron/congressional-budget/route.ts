import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  try {
    // Congressional space budget data requires manual compilation - stub for now.
    await logCronExecution("congressional_budget", "skipped", 0, "Manual data compilation required - stub endpoint");
    return cronSuccess({ source: "congressional_budget", inserted: 0, note: "Stub - manual data compilation required" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("congressional_budget", "error", 0, message);
    return cronError("Failed to refresh Congressional space budget data");
  }
}
