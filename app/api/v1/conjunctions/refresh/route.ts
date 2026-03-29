import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

const SOCRATES_CSV_URL = "https://celestrak.org/SOCRATES/sort-minRange.csv";

// Limit to top 500 closest approaches (CSV is sorted by min range, can be 130K+ rows)
const MAX_RECORDS = 500;

function parseCSV(csv: string, maxRows: number): Record<string, string>[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  const dataLines = lines.slice(1, 1 + maxRows);
  return dataLines.map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = values[i] || "";
    });
    return record;
  });
}

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const admin = createAdminClient();

    const res = await fetch(SOCRATES_CSV_URL);
    if (!res.ok) {
      return apiError("CelesTrak API returned " + res.status, 502);
    }

    const csvText = await res.text();
    const records = parseCSV(csvText, MAX_RECORDS);
    if (records.length === 0) {
      return apiResponse({ inserted: 0, total_fetched: 0, refreshed_at: new Date().toISOString() });
    }

    const rows = records
      .filter((r) => r.NORAD_CAT_ID_1 && r.NORAD_CAT_ID_2 && r.TCA)
      .map((r) => ({
        object1_name: r.OBJECT_NAME_1 || null,
        object1_norad_id: r.NORAD_CAT_ID_1,
        object2_name: r.OBJECT_NAME_2 || null,
        object2_norad_id: r.NORAD_CAT_ID_2,
        tca: r.TCA.replace(" ", "T") + "Z",
        min_range_km: parseFloat(r.TCA_RANGE) || null,
        probability: parseFloat(r.MAX_PROB) || null,
      }));

    // Upsert using the unique index on (object1_norad_id, object2_norad_id, tca)
    let totalUpserted = 0;
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await admin
        .from("conjunction_events")
        .upsert(batch, { onConflict: "object1_norad_id,object2_norad_id,tca", ignoreDuplicates: true });
      if (!error) totalUpserted += batch.length;
    }

    return apiResponse({
      inserted: totalUpserted,
      total_fetched: records.length,
      refreshed_at: new Date().toISOString(),
    });
  } catch {
    return apiError("Failed to refresh conjunction data", 500);
  }
}
