import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

interface NOAAAlert {
  product_id: string;
  issue_datetime: string;
  message: string;
}

function classifySeverity(productId: string, message: string): string {
  const msg = message.toUpperCase();
  if (msg.includes("EXTREME") || msg.includes("G5") || msg.includes("S5") || msg.includes("R5")) return "extreme";
  if (msg.includes("SEVERE") || msg.includes("G4") || msg.includes("S4") || msg.includes("R4")) return "severe";
  if (msg.includes("STRONG") || msg.includes("G3") || msg.includes("S3") || msg.includes("R3")) return "strong";
  if (msg.includes("MODERATE") || msg.includes("G2") || msg.includes("S2") || msg.includes("R2")) return "moderate";
  if (msg.includes("MINOR") || msg.includes("G1") || msg.includes("S1") || msg.includes("R1")) return "minor";
  if (msg.includes("WARNING") || msg.includes("WARN")) return "warning";
  if (msg.includes("WATCH")) return "watch";
  if (msg.includes("ALERT") || msg.includes("CONTINUED ALERT")) return "alert";
  if (msg.includes("SUMMARY")) return "summary";
  return "info";
}

function classifyEventType(productId: string, message: string): string {
  const msg = message.toUpperCase();
  if (msg.includes("GEOMAGNETIC") || msg.includes("K-INDEX")) return "geomagnetic";
  if (msg.includes("SOLAR RADIATION") || msg.includes("PROTON")) return "solar_radiation";
  if (msg.includes("RADIO BLACKOUT") || msg.includes("X-RAY")) return "radio_blackout";
  if (msg.includes("ELECTRON FLUX") || msg.includes("ELECTRON 2MEV")) return "electron_flux";
  if (msg.includes("SOLAR FLARE") || msg.includes("FLARE")) return "solar_flare";
  if (msg.includes("CME") || msg.includes("CORONAL MASS")) return "cme";
  if (msg.includes("SOLAR WIND")) return "solar_wind";
  return "space_weather";
}

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const admin = createAdminClient();

    const res = await fetch("https://services.swpc.noaa.gov/products/alerts.json");
    if (!res.ok) {
      return apiError("NOAA API returned " + res.status, 502);
    }

    const alerts: NOAAAlert[] = await res.json();
    if (!Array.isArray(alerts) || alerts.length === 0) {
      return apiResponse({ inserted: 0, total_fetched: 0, refreshed_at: new Date().toISOString() });
    }

    const rows = alerts.map((a) => ({
      event_type: classifyEventType(a.product_id, a.message),
      message: a.message,
      issue_time: a.issue_datetime.replace(" ", "T") + "Z",
      severity: classifySeverity(a.product_id, a.message),
      source_url: "https://www.swpc.noaa.gov/",
    }));

    // Dedup on issue_time + event_type
    const dedupKeys = rows.map((r) => `${r.issue_time}|${r.event_type}`);
    const { data: existing } = await admin
      .from("space_weather")
      .select("issue_time, event_type");

    const existingKeys = new Set(
      (existing ?? []).map((r: { issue_time: string; event_type: string }) => `${r.issue_time}|${r.event_type}`)
    );

    const newRows = rows.filter((_, i) => !existingKeys.has(dedupKeys[i]));

    let totalInserted = 0;
    if (newRows.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < newRows.length; i += batchSize) {
        const batch = newRows.slice(i, i + batchSize);
        const { error } = await admin.from("space_weather").insert(batch);
        if (!error) totalInserted += batch.length;
      }
    }

    return apiResponse({
      inserted: totalInserted,
      total_fetched: alerts.length,
      refreshed_at: new Date().toISOString(),
    });
  } catch {
    return apiError("Failed to refresh space weather data", 500);
  }
}
