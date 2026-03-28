import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
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

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  const username = process.env.SPACE_TRACK_USERNAME;
  const password = process.env.SPACE_TRACK_PASSWORD;
  if (!username || !password) {
    return apiError("Space-Track credentials not configured", 500);
  }

  try {
    // Authenticate with Space-Track
    const loginRes = await fetch(
      "https://www.space-track.org/ajaxauth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          identity: username,
          password: password,
        }),
      }
    );

    if (!loginRes.ok) {
      return apiError("Space-Track authentication failed", 502);
    }

    // Extract session cookie
    const cookies = loginRes.headers.getSetCookie?.() || [];
    const cookieHeader = cookies.join("; ");

    // Fetch recent GP (General Perturbations) data for active commercial satellites
    // Focus on active objects (no decay date), limit to recent launches
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
      return apiError("Failed to fetch Space-Track data", 502);
    }

    const records: GPRecord[] = await dataRes.json();
    const admin = createAdminClient();

    // Map to our schema
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

    // Upsert by norad_cat_id
    let totalUpserted = 0;
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await admin
        .from("orbital_data")
        .upsert(batch, { onConflict: "norad_cat_id" });
      if (!error) totalUpserted += batch.length;
    }

    return apiResponse({
      upserted: totalUpserted,
      refreshed_at: new Date().toISOString(),
    });
  } catch {
    return apiError("Failed to refresh orbital data", 500);
  }
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
