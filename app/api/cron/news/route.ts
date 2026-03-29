import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

const NEWSAPI_QUERIES = [
  "space defense satellite",
  "aerospace SpaceX launch",
  "military satellite defense contractor",
];

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    await logCronExecution("news", "error", 0, "NEWSAPI_KEY not configured");
    return cronError("NEWSAPI_KEY not configured");
  }

  try {
    const admin = createAdminClient();
    let totalInserted = 0;

    for (const query of NEWSAPI_QUERIES) {
      const params = new URLSearchParams({
        q: query,
        language: "en",
        sortBy: "publishedAt",
        pageSize: "50",
        apiKey,
      });

      const res = await fetch(
        `https://newsapi.org/v2/everything?${params.toString()}`
      );

      if (!res.ok) continue;

      const json = await res.json();
      const articles = (json.articles || []).map(
        (a: {
          title?: string;
          description?: string;
          url?: string;
          source?: { name?: string };
          author?: string;
          urlToImage?: string;
          publishedAt?: string;
        }) => ({
          title: a.title || null,
          summary: a.description || null,
          url: a.url || "",
          source: a.source?.name || "Unknown",
          source_name: a.source?.name || "Unknown",
          author: a.author || null,
          image_url: a.urlToImage || null,
          published_date: a.publishedAt ? a.publishedAt.split("T")[0] : null,
          published_at: a.publishedAt || new Date().toISOString(),
          sentiment: "neutral",
          category: "Space & Defense",
        })
      );

      if (articles.length === 0) continue;

      // Dedup by URL
      const urls = articles.map((a: { url: string }) => a.url).filter(Boolean);
      const { data: existing } = await admin
        .from("news")
        .select("url")
        .in("url", urls);
      const existingUrls = new Set((existing ?? []).map((r) => r.url));

      const newArticles = articles.filter(
        (a: { url: string; title: string | null }) =>
          a.url && a.title && !existingUrls.has(a.url)
      );

      if (newArticles.length > 0) {
        const { error } = await admin.from("news").insert(newArticles);
        if (!error) totalInserted += newArticles.length;
      }
    }

    await logCronExecution("news", "success", totalInserted);
    return cronSuccess({ source: "news", inserted: totalInserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("news", "error", 0, message);
    return cronError("Failed to refresh news");
  }
}
