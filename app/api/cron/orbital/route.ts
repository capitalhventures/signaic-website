import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

interface GPRecord {
  NORAD_CAT_ID: string;
  OBJECT_NAME: string;
  OBJECT_TYPE: string;
  INCLINATION: string;
  PERIOD: string;
  APOAPSIS: string;
  PERIAPSIS: string;
  LAUNCH_DATE: string;
  DECAY_DATE: string | null;
  CLASSIFICATION_TYPE: string;
}

function classifyOrbit(period: number, inclination: number): string {
  if (isNaN(period)) return "Unknown";
  if (period < 128) return "LEO";
  if (period >= 600 && period <= 800) return "MEO";
  if (period >= 1400 && period <= 1450) return "GEO";
  if (inclination > 40 && period > 800) return "HEO";
  if (period >= 128 && period < 600) return "MEO";
  return "Other";
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  const username = process.env.SPACE_TRACK_USERNAME;
  const password = process.env.SPACE_TRACK_PASSWORD;
  if (!username || !password) {
    await logCronExecution("orbital", "error", 0, "Space-Track credentials not configured");
    return cronError("Space-Track credentials not configured");
  }

  try {
    // Authenticate with Space-Track
    const loginRes = await fetch(
      "https://www.space-track.org/ajaxauth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ identity: username, password }),
      }
    );

    if (!loginRes.ok) {
      await logCronExecution("orbital", "error", 0, "Space-Track authentication failed");
      return cronError("Space-Track authentication failed");
    }

    const cookies = loginRes.headers.getSetCookie?.() || [];
    const cookieHeader = cookies.join("; ");

    const queryUrl =
      "https://www.space-track.org/basicspacedata/query/class/gp" +
      "/DECAY_DATE/null-val" +
      "/OBJECT_TYPE/PAYLOAD" +
      "/orderby/LAUNCH_DATE desc" +
      "/limit/200" +
      "/format/json";

    const dataRes = await fetch(queryUrl, {
      headers: { Cookie: cookieHeader },
    });

    if (!dataRes.ok) {
      await logCronExecution("orbital", "error", 0, "Failed to fetch Space-Track data");
      return cronError("Failed to fetch Space-Track data");
    }

    const records: GPRecord[] = await dataRes.json();
    const admin = createAdminClient();

    const rows = records.map((r) => ({
      norad_cat_id: r.NORAD_CAT_ID,
      object_name: r.OBJECT_NAME,
      object_type: r.OBJECT_TYPE || "PAYLOAD",
      orbit_type: classifyOrbit(parseFloat(r.PERIOD), parseFloat(r.INCLINATION)),
      launch_date: r.LAUNCH_DATE || null,
      period: parseFloat(r.PERIOD) || null,
      inclination: parseFloat(r.INCLINATION) || null,
      apoapsis: parseFloat(r.APOAPSIS) || null,
      periapsis: parseFloat(r.PERIAPSIS) || null,
      current_status: r.DECAY_DATE ? "Decayed" : "Active",
      updated_at: new Date().toISOString(),
    }));

    let totalUpserted = 0;
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await admin
        .from("orbital_data")
        .upsert(batch, { onConflict: "norad_cat_id" });
      if (!error) totalUpserted += batch.length;
    }

    await logCronExecution("orbital", "success", totalUpserted);
    return cronSuccess({ source: "orbital", upserted: totalUpserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("orbital", "error", 0, message);
    return cronError("Failed to refresh orbital data");
  }
}
