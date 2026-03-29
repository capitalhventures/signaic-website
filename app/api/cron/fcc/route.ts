import { NextRequest } from "next/server";
import {
  verifyCronSecret,
  logCronExecution,
  cronError,
  cronSuccess,
} from "@/lib/cron";
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

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  try {
    const admin = createAdminClient();
    const apiKey = process.env.FCC_API_KEY || "DEMO_KEY";

    const url = `https://publicapi.fcc.gov/ecfs/filings?api_key=${apiKey}&sort=date_disseminated,DESC&limit=50&q=satellite+OR+spectrum+OR+orbital`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`FCC ECFS API returned ${res.status}`);
    }

    const json = await res.json();
    const filings: EcfsFiling[] = json?.filing || json?.filings || [];

    const rows = filings
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

    // Dedup by file_number (id_submission)
    const fileNums = rows.map((r) => r.file_number).filter(Boolean);
    const { data: existing } = await admin
      .from("fcc_filings")
      .select("file_number")
      .in("file_number", fileNums);
    const existingNums = new Set(
      (existing ?? []).map((r) => r.file_number)
    );

    const newRows = rows.filter((r) => !existingNums.has(r.file_number));

    let totalInserted = 0;
    if (newRows.length > 0) {
      const { error } = await admin.from("fcc_filings").insert(newRows);
      if (!error) totalInserted = newRows.length;
      else console.error("[cron/fcc] Insert error:", error.message);
    }

    await logCronExecution("fcc", "success", totalInserted);
    return cronSuccess({
      source: "fcc",
      inserted: totalInserted,
      total_fetched: rows.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("fcc", "error", 0, message);
    return cronError("Failed to refresh FCC filings");
  }
}
