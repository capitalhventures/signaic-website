import { parseRSSFeed } from "./rss-parser";
import { createAdminClient } from "@/lib/supabase/admin";

export interface FeedConfig {
  sourceName: string;
  feedUrl: string;
}

/**
 * Shared refresh logic for all RSS feed sources.
 * Fetches, parses, and upserts items into rss_feeds with ON CONFLICT url DO NOTHING.
 */
export async function refreshRSSFeed(config: FeedConfig): Promise<{
  inserted: number;
  total: number;
}> {
  const items = await parseRSSFeed(config.feedUrl, config.sourceName);

  if (items.length === 0) {
    return { inserted: 0, total: 0 };
  }

  const admin = createAdminClient();

  const rows = items
    .filter((item) => item.url && item.title)
    .map((item) => ({
      source: config.sourceName,
      title: item.title,
      description: item.description,
      url: item.url,
      author: item.author,
      published_at: item.publishedAt,
      tags: item.tags.length > 0 ? item.tags : null,
    }));

  // Batch insert with upsert, ignoring duplicates
  let inserted = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { count } = await admin
      .from("rss_feeds")
      .upsert(batch, {
        onConflict: "url",
        ignoreDuplicates: true,
        count: "exact",
      });
    inserted += count || 0;
  }

  return { inserted, total: rows.length };
}

/** Feed configurations for all 7 RSS sources */
export const FEED_CONFIGS: Record<string, FeedConfig> = {
  spacenews: {
    sourceName: "SpaceNews",
    feedUrl: "https://spacenews.com/feed/",
  },
  viasatellite: {
    sourceName: "Via Satellite",
    feedUrl: "https://www.satellitetoday.com/feed/",
  },
  defenseone: {
    sourceName: "Defense One",
    feedUrl: "https://www.defenseone.com/rss/all",
  },
  spaceflightnow: {
    sourceName: "SpaceFlightNow",
    feedUrl: "https://spaceflightnow.com/feed/",
  },
  spacecom: {
    sourceName: "Space.com",
    feedUrl: "https://www.space.com/feeds/all",
  },
  csis: {
    sourceName: "CSIS",
    feedUrl: "https://www.csis.org/rss.xml",
  },
  sia: {
    sourceName: "SIA",
    feedUrl: "https://sia.org/feed/",
  },
  breakingdefense: {
    sourceName: "Breaking Defense",
    feedUrl: "https://breakingdefense.com/feed/",
  },
  payloadspace: {
    sourceName: "Payload Space",
    feedUrl: "https://payloadspace.com/feed/",
  },
  warzone: {
    sourceName: "The War Zone",
    feedUrl: "https://www.twz.com/feed",
  },
  defensenews: {
    sourceName: "Defense News",
    feedUrl: "https://www.defensenews.com/arc/outboundfeeds/rss/category/space/",
  },
  esanews: {
    sourceName: "ESA News",
    feedUrl: "https://www.esa.int/rssfeed/Our_Activities/Space_Science",
  },
  spacepolicyonline: {
    sourceName: "SpacePolicyOnline",
    feedUrl: "https://spacepolicyonline.com/feed/",
  },
  nasawatch: {
    sourceName: "NASA Watch",
    feedUrl: "https://nasawatch.com/feed/",
  },
};
