import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";
import { refreshRSSFeed, FEED_CONFIGS } from "@/lib/data-sources/feed-refresh";

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  try {
    const result = await refreshRSSFeed(FEED_CONFIGS.defensenews);
    await logCronExecution("rss_defensenews", "success", result.inserted);
    return cronSuccess({ source: "Defense News", inserted: result.inserted, total: result.total });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("rss_defensenews", "error", 0, message);
    return cronError("Failed to refresh Defense News feed");
  }
}
