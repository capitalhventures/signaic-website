import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

interface FedRegDocument {
  document_number?: string;
  title?: string;
  type?: string;
  agencies?: Array<{ name?: string; raw_name?: string }>;
  publication_date?: string;
  abstract?: string;
  html_url?: string;
  pdf_url?: string;
}

async function fetchFederalRegister() {
  const params = new URLSearchParams({
    "conditions[term]":
      "satellite OR space launch OR spectrum allocation",
    per_page: "50",
    order: "newest",
  });

  const url = `https://www.federalregister.gov/api/v1/documents.json?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Federal Register API returned ${res.status}`);
  }

  const json = await res.json();
  const results: FedRegDocument[] = json?.results || [];

  return results
    .filter((d) => d.document_number)
    .map((d) => ({
      document_number: d.document_number!,
      title: d.title || `Document ${d.document_number}`,
      agency:
        d.agencies?.map((a) => a.name || a.raw_name).join("; ") || null,
      type: d.type || null,
      publication_date: d.publication_date || null,
      abstract: d.abstract?.slice(0, 5000) || null,
      federal_register_url:
        d.html_url ||
        `https://www.federalregister.gov/d/${d.document_number}`,
    }));
}

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const admin = createAdminClient();
    const docs = await fetchFederalRegister();

    if (docs.length === 0) {
      return apiResponse({
        inserted: 0,
        refreshed_at: new Date().toISOString(),
      });
    }

    // Dedup by document_number
    const docNums = docs.map((d) => d.document_number).filter(Boolean);
    const { data: existing } = await admin
      .from("federal_register")
      .select("document_number")
      .in("document_number", docNums);
    const existingNums = new Set(
      (existing ?? []).map((r) => r.document_number)
    );

    const newRows = docs.filter(
      (d) => !existingNums.has(d.document_number)
    );

    let totalInserted = 0;
    if (newRows.length > 0) {
      const { error } = await admin.from("federal_register").insert(newRows);
      if (!error) totalInserted = newRows.length;
      else console.error("[federal_register] Insert error:", error.message);
    }

    return apiResponse({
      inserted: totalInserted,
      total_fetched: docs.length,
      refreshed_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[federal_register] Refresh error:", message);
    return apiError("Failed to refresh Federal Register documents", 500);
  }
}
