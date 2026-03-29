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

export interface ScrapeOptions {
  /** Milliseconds to wait for JS rendering (default: 5000) */
  waitFor?: number;
  /** Request timeout in ms (default: 45000) */
  timeout?: number;
}

/**
 * Scrape a URL using the Firecrawl API and return markdown content.
 * Supports waitFor for JavaScript-heavy pages.
 */
export async function scrapeUrl(
  url: string,
  options?: ScrapeOptions
): Promise<ScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return { markdown: "", success: false, error: "FIRECRAWL_API_KEY not configured" };
  }

  const requestTimeout = options?.timeout ?? 45000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeout);

  try {
    const body: Record<string, unknown> = {
      url,
      formats: ["markdown"],
    };

    if (options?.waitFor) {
      body.waitFor = options.waitFor;
    }

    const res = await fetch(FIRECRAWL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

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
    clearTimeout(timer);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { markdown: "", success: false, error: `Firecrawl scrape failed: ${message}` };
  }
}
