import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";
import { generateDailyBriefing } from "@/lib/generate-briefing";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    await logCronExecution("daily_briefings", "error", 0, "ANTHROPIC_API_KEY not configured");
    return cronError("ANTHROPIC_API_KEY not configured");
  }

  try {
    const result = await generateDailyBriefing();

    await logCronExecution("daily_briefings", "success", 1);
    return cronSuccess({
      source: "daily_briefings",
      briefingId: result.briefingId,
      sourceCount: result.sourceCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("daily_briefings", "error", 0, message);
    return cronError(`Failed to generate briefing: ${message}`);
  }
}
