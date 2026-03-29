import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  await logCronExecution("sbir", "skipped", 0, "Pipeline not yet implemented");
  return cronSuccess({ source: "sbir", status: "not_implemented" });
}
