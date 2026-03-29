import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

// UCS Satellite Database - text/CSV download
const UCS_TEXT_URL = "https://www.ucs.org/media/11493";

function parseTabDelimited(text: string, maxRows: number): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t").map((h) => h.trim().replace(/"/g, ""));
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length && records.length < maxRows; i++) {
    const values = lines[i].split("\t").map((v) => v.trim().replace(/"/g, ""));
    if (values.length < 3) continue;
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] || "";
    });
    records.push(record);
  }

  return records;
}

function findField(record: Record<string, string>, ...candidates: string[]): string {
  for (const c of candidates) {
    const key = Object.keys(record).find(
      (k) => k.toLowerCase().replace(/[^a-z]/g, "") === c.toLowerCase().replace(/[^a-z]/g, "")
    );
    if (key && record[key]) return record[key];
  }
  return "";
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  try {
    const admin = createAdminClient();

    const res = await fetch(UCS_TEXT_URL, {
      headers: {
        "User-Agent": "Signaic/1.0 (https://signaic.com)",
      },
    });

    if (!res.ok) {
      await logCronExecution("ucs_satellites", "error", 0, `HTTP ${res.status}`);
      return cronError(`Failed to fetch UCS data: ${res.status}`);
    }

    const text = await res.text();
    const records = parseTabDelimited(text, 500);

    if (records.length === 0) {
      await logCronExecution("ucs_satellites", "error", 0, "No records parsed");
      return cronError("No records parsed from UCS data");
    }

    const rows = records
      .filter((r) => findField(r, "Name of Satellite", "CurrentOfficialNameofSatellite", "name"))
      .map((r) => ({
        name: findField(r, "Name of Satellite", "CurrentOfficialNameofSatellite", "name") || "Unknown",
        country: findField(r, "Country of Operator", "CountryofOperatorOwner", "country") || null,
        operator: findField(r, "Operator", "OperatorOwner", "operator") || null,
        purpose: findField(r, "Purpose", "purpose") || null,
        orbit_class: findField(r, "Class of Orbit", "ClassofOrbit", "orbit") || null,
        launch_date: findField(r, "Date of Launch", "DateofLaunch", "launch") || null,
        launch_site: findField(r, "Launch Site", "LaunchSite") || null,
        contractor: findField(r, "Contractor", "contractor") || null,
        orbit_type: findField(r, "Type of Orbit", "TypeofOrbit") || null,
        perigee_km: parseFloat(findField(r, "Perigee", "Perigeekm")) || null,
        apogee_km: parseFloat(findField(r, "Apogee", "Apogeekm")) || null,
        period_minutes: parseFloat(findField(r, "Period", "Periodminutes")) || null,
        launch_mass_kg: parseFloat(findField(r, "Launch Mass", "LaunchMasskg")) || null,
        norad_id: findField(r, "NORAD Number", "NORADNumber", "norad") || null,
        source_url: "https://www.ucs.org/resources/satellite-database",
      }));

    // Upsert by norad_id
    let totalInserted = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      // Filter rows with norad_id for upsert, insert others
      const withNorad = batch.filter((r) => r.norad_id);
      const withoutNorad = batch.filter((r) => !r.norad_id);

      if (withNorad.length > 0) {
        const { count } = await admin
          .from("ucs_satellites")
          .upsert(withNorad, {
            onConflict: "norad_id",
            ignoreDuplicates: true,
            count: "exact",
          });
        totalInserted += count || 0;
      }

      if (withoutNorad.length > 0) {
        const { count } = await admin
          .from("ucs_satellites")
          .insert(withoutNorad, { count: "exact" });
        totalInserted += count || 0;
      }
    }

    await logCronExecution("ucs_satellites", "success", totalInserted);
    return cronSuccess({ source: "ucs_satellites", inserted: totalInserted, total: rows.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("ucs_satellites", "error", 0, message);
    return cronError("Failed to refresh UCS satellite database");
  }
}
