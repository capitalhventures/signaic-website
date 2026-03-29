import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

interface EcfsFiling {
  id_submission?: string;
  proceedings?: Array<{
    name?: string;
    description?: string;
    bureau_name?: string;
  }>;
  filers?: Array<{ name?: string }>;
  submissiontype?: { short?: string; description?: string };
  text_data?: string;
  date_disseminated?: string;
  date_received?: string;
  file_number?: string;
}

async function fetchFccFilings() {
  const apiKey = process.env.FCC_API_KEY || "DEMO_KEY";
  const url = `https://publicapi.fcc.gov/ecfs/filings?api_key=${apiKey}&sort=date_disseminated,DESC&limit=50&q=satellite+OR+spectrum+OR+orbital`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`FCC ECFS API returned ${res.status}`);
  }

  const json = await res.json();
  // API returns "filing" (not "filings")
  const filings: EcfsFiling[] = json?.filing || json?.filings || [];

  return filings
    .filter((f) => f.id_submission)
    .map((f) => {
      const procDesc = f.proceedings?.[0]?.description || "";
      const procName = f.proceedings?.[0]?.name || "";

      return {
        file_number: f.id_submission!,
        applicant_name:
          f.filers?.[0]?.name || procDesc || `FCC Filing ${procName}`,
        filing_type:
          f.submissiontype?.short || f.submissiontype?.description || null,
        raw_text: f.text_data?.slice(0, 5000) || null,
        filing_date: f.date_disseminated || f.date_received || null,
        source_url: `https://www.fcc.gov/ecfs/document/${f.id_submission}/1`,
      };
    });
}

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const admin = createAdminClient();
    const filings = await fetchFccFilings();

    if (filings.length === 0) {
      return apiResponse({
        inserted: 0,
        refreshed_at: new Date().toISOString(),
      });
    }

    // Dedup by file_number (id_submission)
    const fileNums = filings.map((f) => f.file_number).filter(Boolean);
    const { data: existing } = await admin
      .from("fcc_filings")
      .select("file_number")
      .in("file_number", fileNums);
    const existingNums = new Set(
      (existing ?? []).map((r) => r.file_number)
    );

    const newRows = filings.filter((f) => !existingNums.has(f.file_number));

    let totalInserted = 0;
    if (newRows.length > 0) {
      const { error } = await admin.from("fcc_filings").insert(newRows);
      if (!error) totalInserted = newRows.length;
      else console.error("[fcc] Insert error:", error.message);
    }

    return apiResponse({
      inserted: totalInserted,
      total_fetched: filings.length,
      refreshed_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[fcc] Refresh error:", message);
    return apiError("Failed to refresh FCC filings", 500);
  }
}
