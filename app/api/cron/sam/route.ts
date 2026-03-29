import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

const NAICS_CODES = [
  "336414", // Guided Missile & Space Vehicle Manufacturing
  "517410", // Satellite Telecommunications
  "541715", // R&D in Physical/Engineering/Life Sciences
  "334511", // Search, Detection, Navigation, Guidance, Aeronautical Systems
];

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
  pointOfContact?: Array<{ fullName?: string; email?: string }>;
  uiLink?: string;
  award?: { amount?: number };
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0].replace(/-/g, "/");
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0].replace(/-/g, "/");
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  const apiKey = process.env.SAM_GOV_API_KEY;
  if (!apiKey) {
    await logCronExecution("sam", "error", 0, "SAM_GOV_API_KEY not configured");
    return cronError("SAM_GOV_API_KEY not configured");
  }

  try {
    const admin = createAdminClient();
    let totalInserted = 0;

    for (const naics of NAICS_CODES) {
      const params = new URLSearchParams({
        api_key: apiKey,
        postedFrom: getDateDaysAgo(90),
        postedTo: getTodayDate(),
        ncode: naics,
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

      const rows = opportunities.map((o) => ({
        solicitation_number: o.solicitationNumber || o.noticeId,
        title: o.title || "Untitled",
        agency: o.fullParentPathName || null,
        description: o.description?.slice(0, 5000) || null,
        naics_code: o.naicsCode || naics,
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
        .from("sam_opportunities")
        .select("solicitation_number")
        .in("solicitation_number", solNums);
      const existingNums = new Set(
        (existing ?? []).map((r) => r.solicitation_number)
      );

      const newRows = rows.filter(
        (r) => !existingNums.has(r.solicitation_number)
      );

      if (newRows.length > 0) {
        const { error } = await admin.from("sam_opportunities").insert(newRows);
        if (!error) totalInserted += newRows.length;
      }
    }

    await logCronExecution("sam", "success", totalInserted);
    return cronSuccess({ source: "sam", inserted: totalInserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("sam", "error", 0, message);
    return cronError("Failed to refresh SAM opportunities");
  }
}
