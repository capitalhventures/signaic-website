import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";
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

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) {
    await logCronExecution("darpa", "error", 0, "SAM_GOV_API_KEY not configured");
    return cronError("SAM_GOV_API_KEY not configured");
  }

  try {
    const admin = createAdminClient();
    let totalInserted = 0;

    // Search SAM.gov for DARPA opportunities using keyword search
    const keywords = [
      "Defense Advanced Research Projects Agency",
      "DARPA",
    ];

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

      if (opportunities.length === 0) continue;

      // Filter to DARPA-specific opportunities
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
          ? [
              o.placeOfPerformance.city?.name,
              o.placeOfPerformance.state?.name,
            ]
              .filter(Boolean)
              .join(", ")
          : null,
        sam_gov_url:
          o.uiLink || `https://sam.gov/opp/${o.noticeId}/view`,
        estimated_value: o.award?.amount || null,
        active: true,
      }));

      // Dedup by solicitation_number
      const solNums = rows.map((r) => r.solicitation_number).filter(Boolean);
      const { data: existing } = await admin
        .from("darpa_opportunities")
        .select("solicitation_number")
        .in("solicitation_number", solNums);
      const existingNums = new Set(
        (existing ?? []).map((r: { solicitation_number: string }) => r.solicitation_number)
      );

      const newRows = rows.filter(
        (r) => !existingNums.has(r.solicitation_number)
      );

      if (newRows.length > 0) {
        const BATCH_SIZE = 50;
        for (let i = 0; i < newRows.length; i += BATCH_SIZE) {
          const batch = newRows.slice(i, i + BATCH_SIZE);
          const { error } = await admin.from("darpa_opportunities").insert(batch);
          if (!error) totalInserted += batch.length;
        }
      }
    }

    await logCronExecution("darpa", "success", totalInserted);
    return cronSuccess({ source: "darpa", inserted: totalInserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("darpa", "error", 0, message);
    return cronError("Failed to refresh DARPA opportunities");
  }
}
