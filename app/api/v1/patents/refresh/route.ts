import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

interface PatentResult {
  patent_number?: string;
  patent_title?: string;
  patent_date?: string;
  patent_abstract?: string;
  assignees?: Array<{
    assignee_organization?: string;
    assignee_first_name?: string;
    assignee_last_name?: string;
  }>;
  applications?: Array<{
    app_date?: string;
  }>;
}

function getDateOneYearAgo(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().split("T")[0];
}

async function fetchPatents(apiKey: string) {
  // New PatentsView API (search.patentsview.org)
  // CPC codes: B64G (space vehicles), H04B7/185 (satellite comms), G01S (radar/navigation)
  const query = {
    _and: [
      { _gte: { patent_date: getDateOneYearAgo() } },
      {
        _or: [
          { _begins: { "cpc_current.cpc_subclass_id": "B64G" } },
          { _begins: { "cpc_current.cpc_subclass_id": "H04B7" } },
          { _begins: { "cpc_current.cpc_subclass_id": "G01S" } },
        ],
      },
    ],
  };

  const params = new URLSearchParams({
    q: JSON.stringify(query),
    f: JSON.stringify([
      "patent_number",
      "patent_title",
      "patent_date",
      "patent_abstract",
      "assignees",
      "applications",
    ]),
    o: JSON.stringify({ size: 50 }),
    s: JSON.stringify([{ patent_date: "desc" }]),
  });

  const res = await fetch(
    `https://search.patentsview.org/api/v1/patent/?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "X-Api-Key": apiKey,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`PatentsView API returned ${res.status}`);
  }

  const json = await res.json();
  const patents: PatentResult[] = json?.patents || [];

  return patents
    .filter((p) => p.patent_number)
    .map((p) => ({
      patent_number: p.patent_number!,
      title: p.patent_title || `Patent ${p.patent_number}`,
      filing_date: p.applications?.[0]?.app_date || null,
      grant_date: p.patent_date || null,
      abstract: p.patent_abstract?.slice(0, 5000) || null,
    }));
}

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const apiKey = process.env.PATENTSVIEW_API_KEY;
  if (!apiKey) {
    return apiResponse({
      status: "source_unavailable",
      message:
        "PATENTSVIEW_API_KEY not configured — register at https://patentsview.org/apis/purpose",
      refreshed_at: new Date().toISOString(),
    });
  }

  try {
    const admin = createAdminClient();
    const patents = await fetchPatents(apiKey);

    if (patents.length === 0) {
      return apiResponse({
        inserted: 0,
        refreshed_at: new Date().toISOString(),
      });
    }

    // Dedup by patent_number
    const patNums = patents.map((p) => p.patent_number).filter(Boolean);
    const { data: existing } = await admin
      .from("patents")
      .select("patent_number")
      .in("patent_number", patNums);
    const existingNums = new Set(
      (existing ?? []).map((r) => r.patent_number)
    );

    const newRows = patents.filter(
      (p) => !existingNums.has(p.patent_number)
    );

    let totalInserted = 0;
    if (newRows.length > 0) {
      const { error } = await admin.from("patents").insert(newRows);
      if (!error) totalInserted = newRows.length;
      else console.error("[patents] Insert error:", error.message);
    }

    return apiResponse({
      inserted: totalInserted,
      total_fetched: patents.length,
      refreshed_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[patents] Refresh error:", message);
    return apiError("Failed to refresh patents", 500);
  }
}
