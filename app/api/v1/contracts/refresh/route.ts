import { apiResponse, apiError, getAuthUser } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

// NAICS codes relevant to space & defense
const NAICS_CODES = [
  "336414", // Guided Missile & Space Vehicle Manufacturing
  "517410", // Satellite Telecommunications
  "541715", // R&D in Physical/Engineering/Life Sciences
  "334511", // Search, Detection, Navigation, Guidance, Aeronautical Systems
  "336415", // Guided Missile & Space Vehicle Propulsion Unit Manufacturing
  "336419", // Other Guided Missile & Space Vehicle Parts Manufacturing
  "541330", // Engineering Services
  "541512", // Computer Systems Design Services
  "928110", // National Security
];

interface USASpendingResult {
  "Award ID"?: string;
  "Award Type"?: string;
  "Awarding Agency"?: string;
  "Awarding Sub Agency"?: string;
  "Recipient Name"?: string;
  "Description"?: string;
  "Award Amount"?: number;
  "Total Outlays"?: number;
  "Start Date"?: string;
  "End Date"?: string;
  "generated_internal_id"?: string;
  "NAICS Code"?: string;
}

export async function POST() {
  const user = await getAuthUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const admin = createAdminClient();
    let totalInserted = 0;

    for (const naics of NAICS_CODES) {
      const body = {
        filters: {
          time_period: [
            {
              start_date: getDateDaysAgo(365),
              end_date: getTodayDate(),
            },
          ],
          award_type_codes: ["A", "B", "C", "D"], // Contracts only
          naics_codes: { require: [naics] },
        },
        fields: [
          "Award ID",
          "Award Type",
          "Awarding Agency",
          "Awarding Sub Agency",
          "Recipient Name",
          "Description",
          "Award Amount",
          "Total Outlays",
          "Start Date",
          "End Date",
          "generated_internal_id",
          "NAICS Code",
        ],
        limit: 50,
        page: 1,
        sort: "Award Amount",
        order: "desc",
      };

      try {
        const res = await fetch(
          "https://api.usaspending.gov/api/v2/search/spending_by_award/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        if (!res.ok) continue;

        const json = await res.json();
        const results: USASpendingResult[] = json.results || [];

        if (results.length === 0) continue;

        const rows = results
          .filter((r) => r["Recipient Name"] && r["Description"])
          .map((r) => ({
            contract_number: r["Award ID"] || null,
            awarding_agency: r["Awarding Agency"] || r["Awarding Sub Agency"] || null,
            contract_title: cleanTitle(r["Description"] || ""),
            contract_value: r["Award Amount"] || r["Total Outlays"] || null,
            period_start: r["Start Date"] || null,
            period_end: r["End Date"] || null,
            contract_type: r["Award Type"] || null,
            description: `${r["Recipient Name"]} — ${(r["Description"] || "").slice(0, 4900)}`,
            naics_code: r["NAICS Code"] || naics,
          }));

        // Dedup by contract_number
        const contractNums = rows
          .map((r) => r.contract_number)
          .filter(Boolean) as string[];

        if (contractNums.length > 0) {
          const { data: existing } = await admin
            .from("gov_contracts")
            .select("contract_number")
            .in("contract_number", contractNums);
          const existingNums = new Set(
            (existing ?? []).map((r) => r.contract_number)
          );

          const newRows = rows.filter(
            (r) => !r.contract_number || !existingNums.has(r.contract_number)
          );

          if (newRows.length > 0) {
            const { error } = await admin.from("gov_contracts").insert(newRows);
            if (!error) totalInserted += newRows.length;
          }
        } else if (rows.length > 0) {
          const { error } = await admin.from("gov_contracts").insert(rows);
          if (!error) totalInserted += rows.length;
        }
      } catch {
        // Skip this NAICS code on error, continue with others
        continue;
      }
    }

    return apiResponse({
      inserted: totalInserted,
      refreshed_at: new Date().toISOString(),
    });
  } catch {
    return apiError("Failed to refresh contracts", 500);
  }
}

function cleanTitle(title: string): string {
  let cleaned = title
    .replace(/^(THIS REQUIREMENT PROVIDES|THE PURPOSE OF THIS)/i, "")
    .replace(/^(IGF::OT::IGF\s*)/i, "")
    .trim();

  if (cleaned.length > 200) {
    cleaned = cleaned.slice(0, 200).trim() + "...";
  }

  return cleaned || title;
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}
