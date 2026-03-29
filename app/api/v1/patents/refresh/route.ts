import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeUrl } from "@/lib/firecrawl";

interface PatentRow {
  patent_number: string;
  title: string;
  filing_date: string | null;
  grant_date: string | null;
  abstract: string | null;
}

const SPACE_DEFENSE_KEYWORDS =
  /satellite|space|orbital|spacecraft|launch vehicle|radar|missile|defense|aerospace|hypersonic|GPS|navigation|communications relay/i;

const USPTO_SCRAPE_URLS = [
  "https://www.uspto.gov/patents/search",
  "https://data.uspto.gov",
];

/**
 * Parse patent data from Firecrawl markdown content.
 * USPTO pages can have various formats - we try multiple extraction strategies.
 */
function parseMarkdownPatents(markdown: string): PatentRow[] {
  const patents: PatentRow[] = [];

  // Strategy 1: Parse markdown tables
  const lines = markdown.split("\n");
  let headerIndices: Record<string, number> = {};
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line.startsWith("|")) {
      inTable = false;
      headerIndices = {};
      continue;
    }

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (cells.every((c) => /^[-:]+$/.test(c))) continue;

    if (!inTable) {
      const lowerCells = cells.map((c) => c.toLowerCase());
      const isPatentTable = lowerCells.some(
        (h) =>
          h.includes("patent") ||
          h.includes("title") ||
          h.includes("inventor") ||
          h.includes("assignee") ||
          h.includes("grant")
      );
      if (!isPatentTable) continue;

      lowerCells.forEach((h, idx) => {
        if (
          h.includes("patent") &&
          (h.includes("number") || h.includes("#") || h.includes("no"))
        )
          headerIndices["patent_number"] = idx;
        if (h.includes("title") && !h.includes("sub"))
          headerIndices["title"] = idx;
        if (h.includes("assignee") || h.includes("applicant") || h.includes("inventor"))
          headerIndices["assignee"] = idx;
        if (h.includes("filing") || h.includes("filed") || h.includes("application"))
          headerIndices["filing_date"] = idx;
        if (h.includes("grant") || h.includes("issued") || h.includes("patent date"))
          headerIndices["grant_date"] = idx;
        if (h.includes("abstract") || h.includes("description"))
          headerIndices["abstract"] = idx;
      });

      inTable = true;
      continue;
    }

    if (cells.length < 2) continue;

    const get = (key: string) =>
      headerIndices[key] !== undefined && headerIndices[key] < cells.length
        ? cells[headerIndices[key]] || null
        : null;

    const patentNumber = get("patent_number") || cells[0];
    const title = get("title") || cells[1] || `Patent ${patentNumber}`;
    if (!patentNumber || patentNumber.toLowerCase().includes("patent number")) continue;

    patents.push({
      patent_number: patentNumber.replace(/[,\s]/g, ""),
      title: title.slice(0, 500),
      filing_date: get("filing_date"),
      grant_date: get("grant_date"),
      abstract: get("abstract")?.slice(0, 5000) || null,
    });
  }

  // Strategy 2: Extract patent numbers from unstructured text
  if (patents.length === 0) {
    // US patent number patterns: US12,345,678 or 12,345,678 or US2024/0123456
    const patentPattern =
      /(?:US\s*)?(\d{1,2}[,.]?\d{3}[,.]?\d{3})\s*(?:B[12])?/g;
    const pubPattern = /(?:US\s*)?(20\d{2}\/\d{7})\s*(?:A1)?/g;

    const seen = new Set<string>();

    // Find granted patents
    let match;
    while ((match = patentPattern.exec(markdown)) !== null) {
      const num = match[1].replace(/[,.\s]/g, "");
      // Must be 7-8 digits (valid US patent range)
      if (num.length < 7 || num.length > 8) continue;
      if (seen.has(num)) continue;

      // Check context for space/defense relevance
      const idx = match.index;
      const context = markdown.slice(
        Math.max(0, idx - 300),
        Math.min(markdown.length, idx + 500)
      );
      if (!SPACE_DEFENSE_KEYWORDS.test(context)) continue;

      seen.add(num);

      const titleMatch = context.match(
        /(?:titled?|entitled)\s*[""']?([^""'\n]{10,150})/i
      );
      const dateMatch = context.match(
        /(?:grant|issued?|filed?)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{2}[/-]\d{2})/i
      );

      patents.push({
        patent_number: num,
        title: titleMatch?.[1]?.trim() || `US Patent ${num}`,
        filing_date: null,
        grant_date: dateMatch?.[1] || null,
        abstract: context.slice(0, 2000),
      });
    }

    // Find published applications
    while ((match = pubPattern.exec(markdown)) !== null) {
      const num = match[1];
      if (seen.has(num)) continue;

      const idx = match.index;
      const context = markdown.slice(
        Math.max(0, idx - 300),
        Math.min(markdown.length, idx + 500)
      );
      if (!SPACE_DEFENSE_KEYWORDS.test(context)) continue;

      seen.add(num);

      const titleMatch = context.match(
        /(?:titled?|entitled)\s*[""']?([^""'\n]{10,150})/i
      );

      patents.push({
        patent_number: num,
        title: titleMatch?.[1]?.trim() || `US Application ${num}`,
        filing_date: null,
        grant_date: null,
        abstract: context.slice(0, 2000),
      });
    }
  }

  // Strategy 3: Extract from heading-based sections
  if (patents.length === 0) {
    const sections = markdown.split(/^#{2,4}\s+/m).filter((s) => s.length > 30);
    let count = 0;
    for (const section of sections) {
      if (count >= 50) break;
      const firstLine = section.split("\n")[0].trim();
      if (firstLine.length < 5) continue;
      if (!SPACE_DEFENSE_KEYWORDS.test(section.slice(0, 500))) continue;

      // Look for patent numbers in the section
      const numMatch = section.match(
        /(?:US\s*)?(\d{7,8}|\d{1,2}[,.]\d{3}[,.]\d{3})/
      );
      if (!numMatch) continue;

      const num = numMatch[1].replace(/[,.\s]/g, "");

      patents.push({
        patent_number: num,
        title: firstLine.slice(0, 500),
        filing_date: null,
        grant_date: null,
        abstract: section.slice(0, 5000),
      });
      count++;
    }
  }

  return patents;
}

/**
 * Scrape Google Patents for space/defense patents as an additional source.
 */
async function scrapeGooglePatents(): Promise<PatentRow[]> {
  const queries = [
    "https://patents.google.com/?q=satellite+communication+system&after=priority:20230101",
    "https://patents.google.com/?q=space+launch+vehicle&after=priority:20230101",
    "https://patents.google.com/?q=orbital+spacecraft+defense&after=priority:20230101",
  ];

  const allPatents: PatentRow[] = [];

  for (const url of queries) {
    const result = await scrapeUrl(url, { waitFor: 5000 });
    if (result.success) {
      const parsed = parseMarkdownPatents(result.markdown);
      console.log(`[patents] Google Patents scraped ${url}: ${parsed.length} patents, md_length=${result.markdown.length}`);
      allPatents.push(...parsed);
    } else {
      console.warn(`[patents] Failed to scrape ${url}: ${result.error}`);
    }
  }

  // If search pages didn't yield results, try known space/defense patent pages
  if (allPatents.length === 0) {
    const knownPatents = [
      { url: "https://patents.google.com/patent/US11827382B2", num: "11827382", desc: "Satellite communication system" },
      { url: "https://patents.google.com/patent/US11661213B2", num: "11661213", desc: "Spacecraft propulsion" },
      { url: "https://patents.google.com/patent/US11738886B1", num: "11738886", desc: "Space launch vehicle" },
      { url: "https://patents.google.com/patent/US11787583B2", num: "11787583", desc: "Satellite constellation management" },
      { url: "https://patents.google.com/patent/US11685554B2", num: "11685554", desc: "Orbital debris tracking" },
      { url: "https://patents.google.com/patent/US11724826B2", num: "11724826", desc: "Satellite signal processing" },
      { url: "https://patents.google.com/patent/US11858673B2", num: "11858673", desc: "Reusable launch vehicle" },
      { url: "https://patents.google.com/patent/US11691769B2", num: "11691769", desc: "Space situational awareness" },
      { url: "https://patents.google.com/patent/US11753187B2", num: "11753187", desc: "Spacecraft docking system" },
      { url: "https://patents.google.com/patent/US11794921B2", num: "11794921", desc: "Satellite propulsion system" },
    ];

    for (const pat of knownPatents) {
      const result = await scrapeUrl(pat.url, { waitFor: 3000 });
      if (result.success && result.markdown.length > 100) {
        // Extract title from scraped page
        const titleMatch = result.markdown.match(/^#\s+(.+)/m);
        const filingMatch = result.markdown.match(
          /(?:Filed|Filing date)[:\s]+([^\n]+)/i
        );
        const grantMatch = result.markdown.match(
          /(?:Grant date|Issue date|Granted)[:\s]+([^\n]+)/i
        );
        const abstractMatch = result.markdown.match(
          /(?:Abstract|Summary)\s*\n+([\s\S]{20,2000}?)(?=\n#|\n\*\*|$)/i
        );

        allPatents.push({
          patent_number: pat.num,
          title: titleMatch?.[1]?.trim() || pat.desc,
          filing_date: filingMatch?.[1]?.trim() || null,
          grant_date: grantMatch?.[1]?.trim() || null,
          abstract: abstractMatch?.[1]?.trim()?.slice(0, 5000) || pat.desc,
        });
        console.log(`[patents] Scraped individual patent ${pat.num}`);
      }
    }
  }

  return allPatents;
}

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    let allPatents: PatentRow[] = [];
    let source = "none";

    const scrapeErrors: string[] = [];

    // 1. Try Google Patents first (most reliable structured results)
    const googlePatents = await scrapeGooglePatents();
    if (googlePatents.length > 0) {
      allPatents.push(...googlePatents);
      source = "firecrawl (Google Patents)";
    }

    // 2. Try USPTO data portal via Firecrawl
    if (allPatents.length === 0) {
      for (const url of USPTO_SCRAPE_URLS) {
        const result = await scrapeUrl(url, { waitFor: 5000 });
        if (result.success) {
          const parsed = parseMarkdownPatents(result.markdown);
          console.log(`[patents] USPTO scraped ${url}: ${parsed.length} patents, md_length=${result.markdown.length}`);
          allPatents.push(...parsed);
          if (allPatents.length > 0) source = "firecrawl (USPTO)";
        } else {
          scrapeErrors.push(`${url}: ${result.error}`);
          console.warn(`[patents] Failed to scrape ${url}: ${result.error}`);
        }
      }
    }

    // Deduplicate by patent_number
    const seen = new Map<string, PatentRow>();
    for (const p of allPatents) {
      if (!seen.has(p.patent_number)) {
        seen.set(p.patent_number, p);
      }
    }
    allPatents = Array.from(seen.values());

    if (allPatents.length === 0) {
      return apiResponse({
        status: "source_unavailable",
        message:
          "No patent data found from USPTO or Google Patents via Firecrawl",
        scrape_errors: scrapeErrors,
        refreshed_at: new Date().toISOString(),
      });
    }

    const admin = createAdminClient();

    // Upsert by patent_number
    const { data: upserted, error: upsertError } = await admin
      .from("patents")
      .upsert(allPatents, { onConflict: "patent_number" })
      .select("id");

    if (upsertError) {
      console.error("[patents] Upsert error:", upsertError.message);
      return apiError("Database upsert failed: " + upsertError.message, 500);
    }

    return apiResponse({
      inserted: upserted?.length ?? allPatents.length,
      total_fetched: allPatents.length,
      source,
      refreshed_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[patents] Refresh error:", message);
    return apiError("Failed to refresh patents", 500);
  }
}
