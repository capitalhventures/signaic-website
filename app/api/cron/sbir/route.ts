import { NextRequest } from "next/server";
import {
  verifyCronSecret,
  logCronExecution,
  cronError,
  cronSuccess,
} from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeUrl } from "@/lib/firecrawl";

interface SbirRow {
  solicitation_number: string;
  title: string;
  agency: string | null;
  phase: string | null;
  award_year: string | null;
  abstract: string | null;
  source_url: string | null;
}

interface SbirSolicitation {
  solicitation_id?: string;
  solicitation_number?: string;
  solicitation_title?: string;
  agency?: string;
  branch?: string;
  program?: string;
  phase?: string;
  open_date?: string;
  close_date?: string;
  description?: string;
  solicitation_year?: string;
  topic_title?: string;
}

interface SamOpportunity {
  noticeId: string;
  solicitationNumber?: string;
  title: string;
  fullParentPathName?: string;
  description?: string;
  type?: string;
  postedDate?: string;
  uiLink?: string;
  award?: { amount?: number };
}

const SPACE_KEYWORDS =
  /space|satellite|launch|orbital|radar|defense|missile|rocket|aerospace|hypersonic/i;

function parseMarkdownSolicitations(markdown: string): SbirRow[] {
  const rows: SbirRow[] = [];
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
      const isSbirTable = lowerCells.some(
        (h) =>
          h.includes("solicitation") ||
          h.includes("topic") ||
          h.includes("title") ||
          h.includes("agency")
      );
      if (!isSbirTable) continue;

      lowerCells.forEach((h, idx) => {
        if (h.includes("title") || h.includes("topic"))
          headerIndices["title"] = idx;
        if (h.includes("agency") || h.includes("department"))
          headerIndices["agency"] = idx;
        if (h.includes("phase")) headerIndices["phase"] = idx;
        if (
          h.includes("solicitation") &&
          (h.includes("number") || h.includes("#") || h.includes("id"))
        )
          headerIndices["solicitation_number"] = idx;
        if (h.includes("open") || h.includes("posted") || h.includes("date"))
          headerIndices["date"] = idx;
        if (h.includes("description") || h.includes("abstract"))
          headerIndices["description"] = idx;
      });

      inTable = true;
      continue;
    }

    if (cells.length < 2) continue;

    const get = (key: string) =>
      headerIndices[key] !== undefined && headerIndices[key] < cells.length
        ? cells[headerIndices[key]] || null
        : null;

    const title = get("title") || cells[0];
    if (!title || title.toLowerCase().includes("title")) continue;

    const solNum =
      get("solicitation_number") ||
      `SBIR-FC-${title.slice(0, 30).replace(/\W+/g, "-")}`;

    rows.push({
      solicitation_number: solNum,
      title: title.slice(0, 500),
      agency: get("agency"),
      phase: get("phase"),
      award_year:
        get("date")?.slice(0, 4) || new Date().getFullYear().toString(),
      abstract: get("description")?.slice(0, 5000) || null,
      source_url: "https://www.sbir.gov/solicitations/open",
    });
  }

  // Fallback: extract solicitation patterns from text
  if (rows.length === 0) {
    const solPattern =
      /(?:SBIR|STTR)[\s-]*(?:\d{2,4}[-.]?\d{0,3}[A-Z]?(?:[-.]?\d+)?)/g;
    const matches = markdown.match(solPattern);
    if (matches) {
      const seen = new Set<string>();
      for (const match of matches) {
        const num = match.trim();
        if (seen.has(num)) continue;
        seen.add(num);

        const idx = markdown.indexOf(match);
        const context = markdown.slice(Math.max(0, idx - 100), idx + 500);
        const titleMatch = context.match(
          /(?:#{1,4}\s+|^\*\*|\n)([^\n*#]{10,100})/
        );
        const agencyMatch = context.match(
          /(?:Agency|Department|Component):\s*([^\n|]+)/i
        );

        rows.push({
          solicitation_number: num,
          title: titleMatch?.[1]?.trim() || `SBIR Solicitation ${num}`,
          agency: agencyMatch?.[1]?.trim() || null,
          phase: context.match(/Phase\s+(I{1,3}|[123])/i)?.[1] || null,
          award_year: new Date().getFullYear().toString(),
          abstract: context.slice(0, 2000) || null,
          source_url: "https://www.sbir.gov/solicitations/open",
        });
      }
    }

    // Fallback: heading-based sections
    if (rows.length === 0) {
      const headingSections = markdown
        .split(/^#{2,4}\s+/m)
        .filter((s) => s.length > 50);
      let count = 0;
      for (const section of headingSections) {
        if (count >= 50) break;
        const firstLine = section.split("\n")[0].trim();
        if (firstLine.length < 5) continue;
        if (!SPACE_KEYWORDS.test(section.slice(0, 500))) continue;

        const agencyMatch = section.match(
          /(?:Agency|Department|Component|Sponsor):\s*([^\n]+)/i
        );
        const phaseMatch = section.match(/Phase\s+(I{1,3}|[123])/i);

        rows.push({
          solicitation_number: `SBIR-FC-${Date.now()}-${count}`,
          title: firstLine.slice(0, 500),
          agency: agencyMatch?.[1]?.trim() || null,
          phase: phaseMatch?.[1] || null,
          award_year: new Date().getFullYear().toString(),
          abstract: section.slice(0, 5000),
          source_url: "https://www.sbir.gov/solicitations/open",
        });
        count++;
      }
    }
  }

  return rows;
}

async function fetchFromSbirGov(): Promise<SbirRow[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch("https://www.sbir.gov/api/solicitations.json", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    clearTimeout(timeout);
    if (!res.ok) return null;

    const json = await res.json();
    const solicitations: SbirSolicitation[] = Array.isArray(json)
      ? json.slice(0, 50)
      : json?.solicitations?.slice(0, 50) || [];

    if (solicitations.length === 0) return null;

    const rows = solicitations
      .filter(
        (s) =>
          SPACE_KEYWORDS.test(s.solicitation_title || s.topic_title || "") ||
          SPACE_KEYWORDS.test(s.description || "")
      )
      .map((s) => ({
        solicitation_number:
          s.solicitation_number || s.solicitation_id || `SBIR-API-${Date.now()}`,
        title: s.solicitation_title || s.topic_title || "SBIR Solicitation",
        agency: s.agency || s.branch || null,
        phase: s.phase || s.program || null,
        award_year: s.solicitation_year || s.open_date?.slice(0, 4) || null,
        abstract: s.description?.slice(0, 5000) || null,
        source_url: s.solicitation_id
          ? `https://www.sbir.gov/node/${s.solicitation_id}`
          : "https://www.sbir.gov/solicitations/open",
      }));

    return rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

async function fetchFromSamGov(): Promise<SbirRow[] | null> {
  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      q: "SBIR OR STTR",
      limit: "50",
    });

    const res = await fetch(
      `https://api.sam.gov/opportunities/v2/search?${params.toString()}`
    );
    if (!res.ok) return null;

    const json = await res.json();
    const opportunities: SamOpportunity[] =
      json.opportunitiesData || json.opportunities || [];

    if (opportunities.length === 0) return null;

    return opportunities.map((o) => ({
      solicitation_number: o.solicitationNumber || o.noticeId,
      title: o.title || "SBIR/STTR Opportunity",
      agency: o.fullParentPathName || null,
      phase: o.type || null,
      award_year: o.postedDate?.slice(0, 4) || null,
      abstract: o.description?.slice(0, 5000) || null,
      source_url: o.uiLink || `https://sam.gov/opp/${o.noticeId}/view`,
    }));
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  try {
    let rows: SbirRow[] = [];
    let source = "none";

    // 1. Firecrawl scraping - multiple URLs with JS wait
    const sbirUrls = [
      "https://www.sbir.gov/solicitations/open",
      "https://www.sbir.gov/past-solicitations",
      "https://www.sbir.gov",
    ];

    for (const url of sbirUrls) {
      if (rows.length > 0) break;
      const result = await scrapeUrl(url, { waitFor: 5000 });
      if (result.success) {
        rows = parseMarkdownSolicitations(result.markdown);
        source = `firecrawl (${url})`;
        console.log(`[cron/sbir] Firecrawl ${url}: ${rows.length} solicitations, md_length=${result.markdown.length}`);
      } else {
        console.warn(`[cron/sbir] Firecrawl failed for ${url}: ${result.error}`);
      }
    }

    // 2. sbir.gov API fallback
    if (rows.length === 0) {
      const apiRows = await fetchFromSbirGov();
      if (apiRows) {
        rows = apiRows;
        source = "sbir.gov";
      }
    }

    // 3. SAM.gov fallback
    if (rows.length === 0) {
      const samRows = await fetchFromSamGov();
      if (samRows) {
        rows = samRows;
        source = "sam.gov";
      }
    }

    if (rows.length === 0) {
      await logCronExecution(
        "sbir",
        "error",
        0,
        "All SBIR sources unavailable (Firecrawl, sbir.gov, SAM.gov)"
      );
      return cronSuccess({
        source: "sbir",
        status: "source_unavailable",
        message: "All SBIR sources unavailable",
      });
    }

    const admin = createAdminClient();

    // Dedup by solicitation_number
    const solNums = rows
      .map((r) => r.solicitation_number)
      .filter(Boolean);
    const { data: existing } = await admin
      .from("sbir_awards")
      .select("solicitation_number")
      .in("solicitation_number", solNums);
    const existingNums = new Set(
      (existing ?? []).map((r) => r.solicitation_number)
    );
    const newRows = rows.filter(
      (r) => !existingNums.has(r.solicitation_number)
    );

    let count = 0;
    if (newRows.length > 0) {
      const { error } = await admin.from("sbir_awards").insert(newRows);
      if (error) {
        console.error("[cron/sbir] Insert error:", error.message);
        await logCronExecution("sbir", "error", 0, error.message);
        return cronError("Database insert failed: " + error.message);
      }
      count = newRows.length;
    }
    await logCronExecution("sbir", "success", count);
    return cronSuccess({
      source: "sbir",
      inserted: count,
      total_fetched: rows.length,
      fetched_from: source,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("sbir", "error", 0, message);
    return cronError("Failed to refresh SBIR data");
  }
}
