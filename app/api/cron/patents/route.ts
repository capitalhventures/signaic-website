import { NextRequest } from "next/server";
import {
  verifyCronSecret,
  logCronExecution,
  cronError,
  cronSuccess,
} from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeUrl } from "@/lib/firecrawl";

interface PatentRow {
  patent_number: string;
  title: string;
  assignee: string | null;
  filing_date: string | null;
  grant_date: string | null;
  abstract: string | null;
  source_url: string;
}

const SPACE_DEFENSE_KEYWORDS =
  /satellite|space|orbital|spacecraft|launch vehicle|radar|missile|defense|aerospace|hypersonic|GPS|navigation|communications relay/i;

const USPTO_SCRAPE_URLS = [
  "https://www.uspto.gov/patents/search",
  "https://data.uspto.gov",
];

function parseMarkdownPatents(markdown: string): PatentRow[] {
  const patents: PatentRow[] = [];
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
        if (
          h.includes("assignee") ||
          h.includes("applicant") ||
          h.includes("inventor")
        )
          headerIndices["assignee"] = idx;
        if (
          h.includes("filing") ||
          h.includes("filed") ||
          h.includes("application")
        )
          headerIndices["filing_date"] = idx;
        if (
          h.includes("grant") ||
          h.includes("issued") ||
          h.includes("patent date")
        )
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
    if (!patentNumber || patentNumber.toLowerCase().includes("patent number"))
      continue;

    patents.push({
      patent_number: patentNumber.replace(/[,\s]/g, ""),
      title: title.slice(0, 500),
      assignee: get("assignee"),
      filing_date: get("filing_date"),
      grant_date: get("grant_date"),
      abstract: get("abstract")?.slice(0, 5000) || null,
      source_url: `https://patents.google.com/patent/US${patentNumber.replace(/[^0-9]/g, "")}`,
    });
  }

  // Fallback: extract patent numbers from text
  if (patents.length === 0) {
    const patentPattern =
      /(?:US\s*)?(\d{1,2}[,.]?\d{3}[,.]?\d{3})\s*(?:B[12])?/g;
    const pubPattern = /(?:US\s*)?(20\d{2}\/\d{7})\s*(?:A1)?/g;
    const seen = new Set<string>();

    let match;
    while ((match = patentPattern.exec(markdown)) !== null) {
      const num = match[1].replace(/[,.\s]/g, "");
      if (num.length < 7 || num.length > 8) continue;
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
      const assigneeMatch = context.match(
        /(?:assign(?:ee|ed to)|applicant|inventor)[:\s]+([^\n,;]{3,80})/i
      );
      const dateMatch = context.match(
        /(?:grant|issued?|filed?)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{2}[/-]\d{2})/i
      );

      patents.push({
        patent_number: num,
        title: titleMatch?.[1]?.trim() || `US Patent ${num}`,
        assignee: assigneeMatch?.[1]?.trim() || null,
        filing_date: null,
        grant_date: dateMatch?.[1] || null,
        abstract: context.slice(0, 2000),
        source_url: `https://patents.google.com/patent/US${num}`,
      });
    }

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
        assignee: null,
        filing_date: null,
        grant_date: null,
        abstract: context.slice(0, 2000),
        source_url: `https://patents.google.com/patent/US${num.replace("/", "")}`,
      });
    }
  }

  // Fallback: heading-based sections
  if (patents.length === 0) {
    const sections = markdown
      .split(/^#{2,4}\s+/m)
      .filter((s) => s.length > 30);
    let count = 0;
    for (const section of sections) {
      if (count >= 50) break;
      const firstLine = section.split("\n")[0].trim();
      if (firstLine.length < 5) continue;
      if (!SPACE_DEFENSE_KEYWORDS.test(section.slice(0, 500))) continue;

      const numMatch = section.match(
        /(?:US\s*)?(\d{7,8}|\d{1,2}[,.]\d{3}[,.]\d{3})/
      );
      if (!numMatch) continue;

      const num = numMatch[1].replace(/[,.\s]/g, "");

      patents.push({
        patent_number: num,
        title: firstLine.slice(0, 500),
        assignee: null,
        filing_date: null,
        grant_date: null,
        abstract: section.slice(0, 5000),
        source_url: `https://patents.google.com/patent/US${num}`,
      });
      count++;
    }
  }

  return patents;
}

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
      console.log(
        `[cron/patents] Google Patents scraped ${url}: ${parsed.length} patents, md_length=${result.markdown.length}`
      );
      allPatents.push(...parsed);
    } else {
      console.warn(`[cron/patents] Failed to scrape ${url}: ${result.error}`);
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
        const titleMatch = result.markdown.match(/^#\s+(.+)/m);
        const assigneeMatch = result.markdown.match(
          /(?:Assignee|Applicant)[:\s]+([^\n]+)/i
        );
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
          assignee: assigneeMatch?.[1]?.trim() || null,
          filing_date: filingMatch?.[1]?.trim() || null,
          grant_date: grantMatch?.[1]?.trim() || null,
          abstract: abstractMatch?.[1]?.trim()?.slice(0, 5000) || pat.desc,
          source_url: pat.url,
        });
        console.log(`[cron/patents] Scraped individual patent ${pat.num}`);
      }
    }
  }

  return allPatents;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  try {
    let allPatents: PatentRow[] = [];
    let source = "none";

    // 1. Try Google Patents first (most reliable structured results)
    const googlePatents = await scrapeGooglePatents();
    if (googlePatents.length > 0) {
      allPatents.push(...googlePatents);
      source = "firecrawl (Google Patents)";
    }

    // 2. Try USPTO via Firecrawl
    if (allPatents.length === 0) {
      for (const url of USPTO_SCRAPE_URLS) {
        const result = await scrapeUrl(url, { waitFor: 5000 });
        if (result.success) {
          const parsed = parseMarkdownPatents(result.markdown);
          console.log(
            `[cron/patents] USPTO scraped ${url}: ${parsed.length} patents, md_length=${result.markdown.length}`
          );
          allPatents.push(...parsed);
          if (allPatents.length > 0) source = "firecrawl (USPTO)";
        } else {
          console.warn(
            `[cron/patents] Failed to scrape ${url}: ${result.error}`
          );
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
      await logCronExecution(
        "patents",
        "skipped",
        0,
        "No patent data found from USPTO or Google Patents via Firecrawl"
      );
      return cronSuccess({
        source: "patents",
        inserted: 0,
        message: "No patent data found via Firecrawl",
      });
    }

    const admin = createAdminClient();

    const { data: upserted, error: upsertError } = await admin
      .from("patents")
      .upsert(allPatents, { onConflict: "patent_number" })
      .select("id");

    if (upsertError) {
      console.error("[cron/patents] Upsert error:", upsertError.message);
      await logCronExecution("patents", "error", 0, upsertError.message);
      return cronError("Database upsert failed: " + upsertError.message);
    }

    const count = upserted?.length ?? allPatents.length;
    await logCronExecution("patents", "success", count);
    return cronSuccess({
      source: "patents",
      inserted: count,
      total_fetched: allPatents.length,
      source_method: source,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("patents", "error", 0, message);
    return cronError("Failed to refresh patents");
  }
}
