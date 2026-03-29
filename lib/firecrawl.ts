const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1/scrape";

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: Record<string, unknown>;
  };
  error?: string;
}

export interface ScrapeResult {
  markdown: string;
  success: boolean;
  error?: string;
}

/**
 * Scrape a URL using the Firecrawl API and return markdown content.
 */
export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return { markdown: "", success: false, error: "FIRECRAWL_API_KEY not configured" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(FIRECRAWL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url, formats: ["markdown"] }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        markdown: "",
        success: false,
        error: `Firecrawl returned ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const json: FirecrawlResponse = await res.json();

    if (!json.success || !json.data?.markdown) {
      return {
        markdown: "",
        success: false,
        error: json.error || "Firecrawl returned no markdown content",
      };
    }

    return { markdown: json.data.markdown, success: true };
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { markdown: "", success: false, error: `Firecrawl scrape failed: ${message}` };
  }
}
