import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

const SOCRATES_CSV_URL = "https://celestrak.org/SOCRATES/sort-minRange.csv";

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
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
    const records = parseCSV(csvText);
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

    // Dedup on object1_norad_id + object2_norad_id + tca
    const dedupKeys = rows.map((r) => `${r.object1_norad_id}|${r.object2_norad_id}|${r.tca}`);
    const { data: existing } = await admin
      .from("conjunction_events")
      .select("object1_norad_id, object2_norad_id, tca");

    const existingKeys = new Set(
      (existing ?? []).map(
        (r: { object1_norad_id: string; object2_norad_id: string; tca: string }) =>
          `${r.object1_norad_id}|${r.object2_norad_id}|${r.tca}`
      )
    );

    const newRows = rows.filter((_, i) => !existingKeys.has(dedupKeys[i]));

    let totalInserted = 0;
    if (newRows.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < newRows.length; i += batchSize) {
        const batch = newRows.slice(i, i + batchSize);
        const { error } = await admin.from("conjunction_events").insert(batch);
        if (!error) totalInserted += batch.length;
      }
    }

    await logCronExecution("conjunctions", "success", totalInserted);
    return cronSuccess({ source: "conjunctions", inserted: totalInserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("conjunctions", "error", 0, message);
    return cronError("Failed to refresh conjunction data");
  }
}
