import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  try {
    // ESA Copernicus requires API key registration - stub for now.
    await logCronExecution("esa_copernicus", "skipped", 0, "API integration pending - stub endpoint");
    return cronSuccess({ source: "esa_copernicus", inserted: 0, note: "Stub - API key registration required" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("esa_copernicus", "error", 0, message);
    return cronError("Failed to refresh ESA Copernicus data");
  }
}
