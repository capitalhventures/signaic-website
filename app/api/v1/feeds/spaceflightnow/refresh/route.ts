import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { refreshRSSFeed, FEED_CONFIGS } from "@/lib/data-sources/feed-refresh";

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const result = await refreshRSSFeed(FEED_CONFIGS.spaceflightnow);
    return apiResponse({
      source: "SpaceFlightNow",
      inserted: result.inserted,
      total: result.total,
      refreshed_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(`Failed to refresh SpaceFlightNow: ${message}`, 500);
  }
}
