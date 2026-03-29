import { apiResponse, apiError, getAuthUser, checkRateLimit } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

interface SamOpportunity {
  noticeId: string;
  solicitationNumber?: string;
  title: string;
  fullParentPathName?: string;
  description?: string;
  naicsCode?: string;
  pscCode?: string;
  postedDate?: string;
  responseDeadLine?: string;
  type?: string;
  setAside?: string;
  placeOfPerformance?: { city?: { name?: string }; state?: { name?: string } };
  uiLink?: string;
  award?: { amount?: number };
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

function getTodayDate(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  if (!checkRateLimit(`darpa:${user.id}`, 60)) {
    return apiError("Rate limit exceeded", 429);
  }

  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) return apiError("SAM_GOV_API_KEY not configured", 500);

  try {
    const admin = createAdminClient();
    let totalInserted = 0;

    const keywords = ["Defense Advanced Research Projects Agency", "DARPA"];

    for (const keyword of keywords) {
      const params = new URLSearchParams({
        api_key: apiKey,
        postedFrom: getDateDaysAgo(90),
        postedTo: getTodayDate(),
        q: keyword,
        limit: "100",
      });

      const res = await fetch(
        `https://api.sam.gov/opportunities/v2/search?${params.toString()}`
      );

      if (!res.ok) continue;

      const json = await res.json();
      const opportunities: SamOpportunity[] =
        json.opportunitiesData || json.opportunities || [];

      const darpaOpps = opportunities.filter(
        (o) =>
          o.fullParentPathName?.toUpperCase().includes("DARPA") ||
          o.title?.toUpperCase().includes("DARPA") ||
          o.fullParentPathName
            ?.toUpperCase()
            .includes("DEFENSE ADVANCED RESEARCH PROJECTS AGENCY")
      );

      if (darpaOpps.length === 0) continue;

      const rows = darpaOpps.map((o) => ({
        solicitation_number: o.solicitationNumber || o.noticeId,
        title: o.title || "Untitled",
        agency: o.fullParentPathName || "DARPA",
        description: o.description?.slice(0, 5000) || null,
        naics_code: o.naicsCode || null,
        psc_code: o.pscCode || null,
        posted_date: o.postedDate || null,
        response_deadline: o.responseDeadLine || null,
        opportunity_type: o.type || null,
        set_aside_type: o.setAside || null,
        place_of_performance: o.placeOfPerformance
          ? [o.placeOfPerformance.city?.name, o.placeOfPerformance.state?.name]
              .filter(Boolean)
              .join(", ")
          : null,
        sam_gov_url: o.uiLink || `https://sam.gov/opp/${o.noticeId}/view`,
        estimated_value: o.award?.amount || null,
        active: true,
      }));

      const solNums = rows.map((r) => r.solicitation_number).filter(Boolean);
      const { data: existing } = await admin
        .from("darpa_opportunities")
        .select("solicitation_number")
        .in("solicitation_number", solNums);
      const existingNums = new Set(
        (existing ?? []).map((r: { solicitation_number: string }) => r.solicitation_number)
      );

      const newRows = rows.filter((r) => !existingNums.has(r.solicitation_number));

      if (newRows.length > 0) {
        const { error } = await admin.from("darpa_opportunities").insert(newRows);
        if (!error) totalInserted += newRows.length;
      }
    }

    return apiResponse({
      source: "darpa",
      inserted: totalInserted,
      refreshed_at: new Date().toISOString(),
    });
  } catch {
    return apiError("Failed to refresh DARPA opportunities", 500);
  }
}
