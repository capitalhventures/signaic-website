import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

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

async function fetchFromSbirGov(): Promise<{
  rows: Array<Record<string, unknown>>;
  source: string;
} | null> {
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
          (s.solicitation_title || s.topic_title || "")
            .toLowerCase()
            .match(/space|satellite|launch|orbital|radar|defense/) ||
          (s.description || "")
            .toLowerCase()
            .match(/space|satellite|launch|orbital/)
      )
      .map((s) => ({
        solicitation_number:
          s.solicitation_number || s.solicitation_id || null,
        title:
          s.solicitation_title || s.topic_title || "SBIR Solicitation",
        agency: s.agency || s.branch || null,
        phase: s.phase || s.program || null,
        award_year: s.solicitation_year || s.open_date?.slice(0, 4) || null,
        abstract: s.description?.slice(0, 5000) || null,
        sbir_gov_url: s.solicitation_id
          ? `https://www.sbir.gov/node/${s.solicitation_id}`
          : null,
      }));

    return { rows, source: "sbir.gov" };
  } catch {
    return null;
  }
}

async function fetchFromSamGov(): Promise<{
  rows: Array<Record<string, unknown>>;
  source: string;
} | null> {
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

    const rows = opportunities.map((o) => ({
      solicitation_number: o.solicitationNumber || o.noticeId,
      title: o.title || "SBIR/STTR Opportunity",
      agency: o.fullParentPathName || null,
      phase: o.type || null,
      award_amount: o.award?.amount || null,
      award_year: o.postedDate?.slice(0, 4) || null,
      abstract: o.description?.slice(0, 5000) || null,
      sbir_gov_url:
        o.uiLink || `https://sam.gov/opp/${o.noticeId}/view`,
    }));

    return { rows, source: "sam.gov" };
  } catch {
    return null;
  }
}

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    // Try SBIR.gov first, then SAM.gov fallback
    let result = await fetchFromSbirGov();
    if (!result) {
      result = await fetchFromSamGov();
    }

    if (!result) {
      return apiResponse({
        status: "source_unavailable",
        message: "SBIR.gov API experiencing outages, SAM.gov fallback also unavailable",
        refreshed_at: new Date().toISOString(),
      });
    }

    const admin = createAdminClient();
    const { rows, source } = result;

    if (rows.length === 0) {
      return apiResponse({
        inserted: 0,
        source,
        refreshed_at: new Date().toISOString(),
      });
    }

    // Dedup by solicitation_number
    const solNums = rows
      .map((r) => r.solicitation_number as string)
      .filter(Boolean);
    const { data: existing } = await admin
      .from("sbir_awards")
      .select("solicitation_number")
      .in("solicitation_number", solNums);
    const existingNums = new Set(
      (existing ?? []).map((r) => r.solicitation_number)
    );

    const newRows = rows.filter(
      (r) =>
        r.solicitation_number &&
        !existingNums.has(r.solicitation_number as string)
    );

    let totalInserted = 0;
    if (newRows.length > 0) {
      const { error } = await admin.from("sbir_awards").insert(newRows);
      if (!error) totalInserted = newRows.length;
      else console.error("[sbir] Insert error:", error.message);
    }

    return apiResponse({
      inserted: totalInserted,
      total_fetched: rows.length,
      source,
      refreshed_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[sbir] Refresh error:", message);
    return apiError("Failed to refresh SBIR data", 500);
  }
}
