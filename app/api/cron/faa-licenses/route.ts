import { NextRequest } from "next/server";
import { verifyCronSecret, logCronExecution, cronError, cronSuccess } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeUrl } from "@/lib/firecrawl";

const FAA_URLS = [
  "https://www.faa.gov/space/licenses",
  "https://www.faa.gov/space/licenses/operator_licenses_permits",
];

interface ParsedLicense {
  licensee: string;
  license_number: string;
  vehicle: string | null;
  launch_site: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
}

function parseMarkdownLicenses(markdown: string): ParsedLicense[] {
  const licenses: ParsedLicense[] = [];
  const lines = markdown.split("\n");

  let headerIndices: Record<string, number> = {};
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line.startsWith("|")) {
      inTable = false;
      headerIndices = {};
      continue;
    }

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (cells.every((c) => /^[-:]+$/.test(c))) continue;

    if (!inTable) {
      const lowerCells = cells.map((c) => c.toLowerCase());
      const hasLicenseCol = lowerCells.some(
        (h) =>
          h.includes("license") ||
          h.includes("licensee") ||
          h.includes("operator") ||
          h.includes("company")
      );
      if (!hasLicenseCol) continue;

      lowerCells.forEach((h, idx) => {
        if (h.includes("licensee") || h.includes("operator") || h.includes("company"))
          headerIndices["licensee"] = idx;
        if (h.includes("license") && (h.includes("number") || h.includes("#") || h.includes("no")))
          headerIndices["license_number"] = idx;
        if (h.includes("vehicle") || h.includes("rocket") || h.includes("launch vehicle"))
          headerIndices["vehicle"] = idx;
        if (h.includes("site") || h.includes("location") || h.includes("spaceport"))
          headerIndices["launch_site"] = idx;
        if (h.includes("issue") || h.includes("effective"))
          headerIndices["issue_date"] = idx;
        if (h.includes("expir") || h.includes("end"))
          headerIndices["expiry_date"] = idx;
        if (h.includes("status"))
          headerIndices["status"] = idx;
      });

      if (!headerIndices["licensee"] && !headerIndices["license_number"]) {
        if (lowerCells.some((h) => h.includes("license"))) {
          headerIndices["licensee"] = 0;
          if (cells.length > 1) headerIndices["license_number"] = 1;
        }
      }

      inTable = true;
      continue;
    }

    if (cells.length < 2) continue;

    const get = (key: string) =>
      headerIndices[key] !== undefined && headerIndices[key] < cells.length
        ? cells[headerIndices[key]] || null
        : null;

    const licensee = get("licensee") || cells[0];
    const licenseNumber = get("license_number") || cells[1];
    if (!licensee || !licenseNumber) continue;
    if (licensee.toLowerCase().includes("licensee")) continue;

    licenses.push({
      licensee,
      license_number: licenseNumber,
      vehicle: get("vehicle"),
      launch_site: get("launch_site"),
      issue_date: get("issue_date"),
      expiry_date: get("expiry_date"),
      status: get("status") || "active",
    });
  }

  // Fallback: extract license numbers from unstructured content
  if (licenses.length === 0) {
    const licensePattern =
      /(?:LSO|LSP|LLS|LRLO)\s*[-#]?\s*\d{2}-\d{3}[A-Z]?/g;
    const matches = markdown.match(licensePattern);
    if (matches) {
      const seen = new Set<string>();
      for (const match of matches) {
        const num = match.trim();
        if (seen.has(num)) continue;
        seen.add(num);

        const idx = markdown.indexOf(match);
        const context = markdown.slice(Math.max(0, idx - 200), idx + 300);
        const licenseeMatch = context.match(
          /(?:^|\n)\s*\*?\*?([A-Z][A-Za-z\s&.,]+(?:LLC|Inc|Corp|Co|LP|Ltd)?)[\s*]*[-–|]/
        );

        licenses.push({
          licensee: licenseeMatch?.[1]?.trim() || "Unknown Licensee",
          license_number: num,
          vehicle: null,
          launch_site: null,
          issue_date: null,
          expiry_date: null,
          status: "active",
        });
      }
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
    let allLicenses: ParsedLicense[] = [];
    const errors: string[] = [];

    for (const url of FAA_URLS) {
      const result = await scrapeUrl(url);
      if (result.success) {
        const parsed = parseMarkdownLicenses(result.markdown);
        console.log(`[cron/faa-licenses] Scraped ${url}: ${parsed.length} licenses found`);
        allLicenses.push(...parsed);
      } else {
        console.warn(`[cron/faa-licenses] Failed to scrape ${url}: ${result.error}`);
        errors.push(`${url}: ${result.error}`);
      }
    }

    // Deduplicate by license_number
    const seen = new Map<string, ParsedLicense>();
    for (const lic of allLicenses) {
      if (!seen.has(lic.license_number)) {
        seen.set(lic.license_number, lic);
      }
    }
    allLicenses = Array.from(seen.values());

    if (allLicenses.length === 0) {
      await logCronExecution(
        "faa_licenses",
        "skipped",
        0,
        "No license data found from FAA pages via Firecrawl"
      );
      return cronSuccess({
        source: "faa_licenses",
        inserted: 0,
        message: "No structured data found",
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    const { data: upserted, error: upsertError } = await admin
      .from("launch_licenses")
      .upsert(allLicenses, { onConflict: "license_number" })
      .select("id");

    if (upsertError) {
      await logCronExecution("faa_licenses", "error", 0, upsertError.message);
      return cronError("Database upsert failed: " + upsertError.message);
    }

    const count = upserted?.length ?? allLicenses.length;
    await logCronExecution("faa_licenses", "success", count);
    return cronSuccess({ source: "faa_licenses", inserted: count, source_method: "firecrawl" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await logCronExecution("faa_licenses", "error", 0, message);
    return cronError("Failed to refresh FAA license data");
  }
}
