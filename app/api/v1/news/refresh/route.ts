import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

const NEWSAPI_QUERIES = [
  "space defense satellite",
  "aerospace SpaceX launch",
  "military satellite defense contractor",
];

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) {
    return apiError("NEWSAPI_KEY not configured", 500);
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
          title: a.title || "Untitled",
          description: a.description || null,
          url: a.url || "",
          source_name: a.source?.name || "Unknown",
          author: a.author || null,
          image_url: a.urlToImage || null,
          published_at: a.publishedAt || new Date().toISOString(),
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
        (a: { url: string }) => a.url && !existingUrls.has(a.url)
      );

      if (newArticles.length > 0) {
        const { error } = await admin.from("news").insert(newArticles);
        if (!error) totalInserted += newArticles.length;
      }
    }

    return apiResponse({
      inserted: totalInserted,
      refreshed_at: new Date().toISOString(),
    });
  } catch {
    return apiError("Failed to refresh news", 500);
  }
}
