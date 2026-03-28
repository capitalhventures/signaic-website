import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase/server";

interface NewsArticle {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source_name: string;
  author: string | null;
  image_url: string | null;
  published_at: string;
}

const NEWSAPI_QUERY = "space defense satellite launch SpaceX";
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`news-live:${user.id}`, 30)) {
    return apiError("Rate limit exceeded", 429);
  }

  try {
    const supabase = createClient();

    // Try Supabase first
    const { data: dbNews } = await supabase
      .from("news")
      .select("id, title, description, url, source_name, author, image_url, published_at")
      .order("published_at", { ascending: false })
      .limit(50);

    // Check if we have fresh data (any article published in last 24h)
    const hasFreshData =
      dbNews &&
      dbNews.length > 0 &&
      Date.now() - new Date(dbNews[0].published_at).getTime() < STALE_THRESHOLD_MS;

    if (hasFreshData) {
      return apiResponse(dbNews as NewsArticle[]);
    }

    // Fall back to live NewsAPI
    const apiKey = process.env.NEWSAPI_KEY;
    if (!apiKey) {
      // Return whatever we have from the database, even if stale
      if (dbNews && dbNews.length > 0) {
        return apiResponse(dbNews as NewsArticle[]);
      }
      return apiResponse([]);
    }

    const params = new URLSearchParams({
      q: NEWSAPI_QUERY,
      language: "en",
      sortBy: "publishedAt",
      pageSize: "50",
      apiKey,
    });

    const res = await fetch(
      `https://newsapi.org/v2/everything?${params.toString()}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      // Return stale DB data on API failure
      if (dbNews && dbNews.length > 0) {
        return apiResponse(dbNews as NewsArticle[]);
      }
      return apiResponse([]);
    }

    const json = await res.json();
    const articles: NewsArticle[] = (json.articles || []).map(
      (a: {
        title?: string;
        description?: string;
        url?: string;
        source?: { name?: string };
        author?: string;
        urlToImage?: string;
        publishedAt?: string;
      }) => ({
        id: crypto.randomUUID(),
        title: a.title || "Untitled",
        description: a.description || null,
        url: a.url || "",
        source_name: a.source?.name || "Unknown",
        author: a.author || null,
        image_url: a.urlToImage || null,
        published_at: a.publishedAt || new Date().toISOString(),
      })
    );

    // Cache articles into Supabase (fire-and-forget, skip duplicates)
    if (articles.length > 0) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const admin = createAdminClient();

      // Check which URLs already exist
      const urls = articles.map((a) => a.url);
      const { data: existing } = await admin
        .from("news")
        .select("url")
        .in("url", urls);
      const existingUrls = new Set((existing ?? []).map((r) => r.url));

      const newArticles = articles
        .filter((a) => a.title && a.title !== "Untitled" && !existingUrls.has(a.url))
        .map((a) => ({
          title: a.title,
          summary: a.description,
          url: a.url,
          source: a.source_name,
          source_name: a.source_name,
          author: a.author,
          image_url: a.image_url,
          published_date: a.published_at ? a.published_at.split("T")[0] : null,
          published_at: a.published_at,
          sentiment: "neutral",
          category: "Space & Defense",
        }));

      if (newArticles.length > 0) {
        await admin.from("news").insert(newArticles);
      }
    }

    return apiResponse(articles);
  } catch {
    return apiError("Internal server error", 500);
  }
}
