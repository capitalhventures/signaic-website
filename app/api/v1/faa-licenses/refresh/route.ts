import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
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

  // Look for table rows with license data
  const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
  if (!tableMatch) return licenses;

  for (const table of tableMatch) {
    const rowMatches = table.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    if (!rowMatches || rowMatches.length < 2) continue;

    // Extract headers
    const headerRow = rowMatches[0];
    const headers = (headerRow.match(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi) || [])
      .map((cell) => cell.replace(/<[^>]+>/g, "").trim().toLowerCase());

    // Check if this looks like a license table
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

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const admin = createAdminClient();

    const res = await fetch(FAA_LICENSES_URL, {
      headers: {
        "User-Agent": "Signaic Intelligence Platform (signaic.com)",
      },
    });

    if (!res.ok) {
      return apiError("FAA page returned " + res.status, 502);
    }

    const html = await res.text();
    const licenses = parseHTMLTable(html);

    if (licenses.length === 0) {
      return apiResponse({
        inserted: 0,
        total_fetched: 0,
        message: "No structured license data found on FAA page. The FAA may use dynamic content loading.",
        refreshed_at: new Date().toISOString(),
      });
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

    return apiResponse({
      inserted: totalInserted,
      total_fetched: licenses.length,
      refreshed_at: new Date().toISOString(),
    });
  } catch {
    return apiError("Failed to refresh FAA license data", 500);
  }
}
