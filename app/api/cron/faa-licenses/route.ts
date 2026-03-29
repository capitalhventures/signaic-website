import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

const FAA_LICENSES_URL = "https://www.faa.gov/data_research/commercial_space_data/licenses";

interface ParsedLicense {
  licensee: string;
  license_number: string;
  vehicle: string | null;
  launch_site: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
}

function parseHTMLTable(html: string): ParsedLicense[] {
  const licenses: ParsedLicense[] = [];

  const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
  if (!tableMatch) return licenses;

  for (const table of tableMatch) {
    const rowMatches = table.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    if (!rowMatches || rowMatches.length < 2) continue;

    const headerRow = rowMatches[0];
    const headers = (headerRow.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi) || [])
      .map((cell) => cell.replace(/<[^>]+>/g, "").trim().toLowerCase());

    const hasLicenseCol = headers.some((h) =>
      h.includes("license") || h.includes("licensee") || h.includes("operator")
    );
    if (!hasLicenseCol) continue;

    for (let i = 1; i < rowMatches.length; i++) {
      const cells = (rowMatches[i].match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [])
        .map((cell) => cell.replace(/<[^>]+>/g, "").trim());

      if (cells.length < 2) continue;

      const findCol = (keywords: string[]) => {
        const idx = headers.findIndex((h) => keywords.some((k) => h.includes(k)));
        return idx >= 0 && idx < cells.length ? cells[idx] : null;
      };

      const licensee = findCol(["licensee", "operator", "company"]) || cells[0];
      const licenseNumber = findCol(["license", "number", "permit"]) || cells[1];
      if (!licensee || !licenseNumber) continue;

      licenses.push({
        licensee,
        license_number: licenseNumber,
        vehicle: findCol(["vehicle", "rocket", "launch vehicle"]),
        launch_site: findCol(["site", "location", "launch site", "spaceport"]),
        issue_date: findCol(["issue", "issued", "effective"]),
        expiry_date: findCol(["expir", "expire", "end date"]),
        status: findCol(["status"]) || "active",
      });
    }
  }

  return licenses;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return cronError("Unauthorized", 401);
  }

  try {
    const admin = createAdminClient();

    const res = await fetch(FAA_LICENSES_URL, {
      headers: {
        "User-Agent": "Signaic Intelligence Platform (signaic.com)",
      },
    });

    if (!res.ok) {
      await logCronExecution("faa_licenses", "error", 0, "FAA page returned " + res.status);
      return cronError("FAA page returned " + res.status);
    }

    const html = await res.text();
    const licenses = parseHTMLTable(html);

    if (licenses.length === 0) {
      await logCronExecution("faa_licenses", "skipped", 0, "No structured license data found on FAA page");
      return cronSuccess({ source: "faa_licenses", inserted: 0, message: "No structured data found" });
    }

    // Dedup on license_number
    const licenseNumbers = licenses.map((l) => l.license_number).filter(Boolean);
    const { data: existing } = await admin
      .from("launch_licenses")
      .select("license_number")
      .in("license_number", licenseNumbers);

    const existingNumbers = new Set((existing ?? []).map((r) => r.license_number));
    const newLicenses = licenses.filter((l) => !existingNumbers.has(l.license_number));

    let totalInserted = 0;
    if (newLicenses.length > 0) {
      const { error } = await admin.from("launch_licenses").insert(newLicenses);
      if (!error) totalInserted = newLicenses.length;
    }

    await logCronExecution("faa_licenses", "success", totalInserted);
    return cronSuccess({ source: "faa_licenses", inserted: totalInserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("faa_licenses", "error", 0, message);
    return cronError("Failed to refresh FAA license data");
  }
}
