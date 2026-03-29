import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { generateDailyBriefing } from "@/lib/generate-briefing";

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!process.env.ANTHROPIC_API_KEY) {
    return apiError("ANTHROPIC_API_KEY not configured", 500);
  }

  try {
    const result = await generateDailyBriefing();

    return apiResponse({
      message: "Briefing generated successfully",
      briefingId: result.briefingId,
      sourceCount: result.sourceCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(`Failed to generate briefing: ${message}`, 500);
  }
}
