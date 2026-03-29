import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

interface EdgarHit {
  _id: string;
  _source: {
    entity_name?: string;
    entity_id?: string;
    file_date?: string;
    form_type?: string;
    file_description?: string;
    display_names?: string[];
  };
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

async function fetchSecFilings() {
  const q = encodeURIComponent(
    '"space" OR "satellite" OR "launch" OR "orbital"'
  );
  const forms = "10-K,10-Q,8-K,S-1";
  const startdt = getDateDaysAgo(90);
  const enddt = getTodayDate();

  const url = `https://efts.sec.gov/LATEST/search-index?q=${q}&forms=${forms}&dateRange=custom&startdt=${startdt}&enddt=${enddt}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Signaic/1.0 (ryan@signaic.com)",
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`EDGAR API returned ${res.status}`);
  }

  const json = await res.json();
  const hits: EdgarHit[] = json?.hits?.hits || [];

  return hits.map((hit) => {
    const src = hit._source;
    const accessionRaw = hit._id?.split(":")[0] || "";
    const cik = src.entity_id || "";
    const accessionNoDashes = accessionRaw.replace(/-/g, "");

    return {
      accession_number: accessionRaw,
      cik,
      filing_type: src.form_type || null,
      description:
        src.file_description ||
        `${src.form_type || "Filing"} - ${src.entity_name || "Unknown"}`,
      filed_date: src.file_date || null,
      document_url:
        cik && accessionNoDashes
          ? `https://www.sec.gov/Archives/edgar/data/${cik}/${accessionNoDashes}/`
          : null,
    };
  });
}

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const admin = createAdminClient();
    const filings = await fetchSecFilings();

    if (filings.length === 0) {
      return apiResponse({ inserted: 0, refreshed_at: new Date().toISOString() });
    }

    // Deduplicate within batch (EDGAR returns multiple files per filing)
    const seen = new Set<string>();
    const unique = filings.filter((f) => {
      if (!f.accession_number || seen.has(f.accession_number)) return false;
      seen.add(f.accession_number);
      return true;
    });

    // Dedup against DB
    const accNums = unique.map((f) => f.accession_number);
    const { data: existing } = await admin
      .from("sec_filings")
      .select("accession_number")
      .in("accession_number", accNums);
    const existingNums = new Set(
      (existing ?? []).map((r) => r.accession_number)
    );

    const newRows = unique.filter(
      (f) => !existingNums.has(f.accession_number)
    );

    let totalInserted = 0;
    if (newRows.length > 0) {
      const { error } = await admin.from("sec_filings").insert(newRows);
      if (!error) totalInserted = newRows.length;
      else console.error("[sec] Insert error:", error.message);
    }

    return apiResponse({
      inserted: totalInserted,
      total_fetched: filings.length,
      refreshed_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[sec] Refresh error:", message);
    return apiError("Failed to refresh SEC filings", 500);
  }
}
