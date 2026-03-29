import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  try {
    // ITU BRIFIC requires subscription access - stub for now.
    await logCronExecution("itu_brific", "skipped", 0, "Subscription access required - stub endpoint");
    return cronSuccess({ source: "itu_brific", inserted: 0, note: "Stub - subscription access required" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("itu_brific", "error", 0, message);
    return cronError("Failed to refresh ITU BRIFIC data");
  }
}
