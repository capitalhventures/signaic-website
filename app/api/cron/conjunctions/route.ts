import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";
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

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  try {
    const admin = createAdminClient();

    const res = await fetch(SOCRATES_CSV_URL);
    if (!res.ok) {
      await logCronExecution("conjunctions", "error", 0, "CelesTrak API returned " + res.status);
      return cronError("CelesTrak API returned " + res.status);
    }

    const csvText = await res.text();
    const records = parseCSV(csvText, MAX_RECORDS);
    if (records.length === 0) {
      await logCronExecution("conjunctions", "success", 0);
      return cronSuccess({ source: "conjunctions", inserted: 0 });
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

    await logCronExecution("conjunctions", "success", totalUpserted);
    return cronSuccess({ source: "conjunctions", inserted: totalUpserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("conjunctions", "error", 0, message);
    return cronError("Failed to refresh conjunction data");
  }
}
