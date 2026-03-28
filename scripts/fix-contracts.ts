/**
 * Session E-2: Clean up gov_contracts table.
 *
 * Problem: 57,923 bulk USASpending records with generic titles, no NAICS codes,
 * and "Classified / Withheld" contractor names.
 *
 * Strategy:
 *  1. Keep records linked to tracked companies (company_id not null).
 *  2. Keep records matching space/defense keywords in title/description.
 *  3. Delete everything else.
 *  4. Clean up titles: strip "THIS REQUIREMENT PROVIDES" boilerplate, apply title case.
 *  5. Log before/after counts.
 *
 * Usage: npx tsx scripts/fix-contracts.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Space/defense keywords for filtering relevant contracts
const SPACE_DEFENSE_KEYWORDS = [
  "satellite", "space", "orbital", "launch vehicle", "rocket",
  "missile defense", "missile", "ballistic", "icbm",
  "ground station", "space force", "gps", "reconnaissance",
  "space surveillance", "radar", "lidar", "hypersonic",
  "spacecraft", "payload", "propulsion", "reentry",
  "c4isr", "sigint", "elint", "geoint", "masint",
  "cybersecurity", "electronic warfare", "ew system",
  "unmanned", "uav", "uas", "drone",
  "f-35", "f-22", "b-21", "kc-46",
  "aegis", "thaad", "patriot", "sbirs", "opir",
  "geostationary", "leo constellation", "meo",
  "spectrum", "frequency", "rf system",
  "defense intelligence", "national security",
  "space command", "stratcom", "spacecom",
  "northrop grumman", "lockheed martin", "raytheon",
  "l3harris", "boeing defense", "spacex", "rocket lab",
  "blue origin", "united launch alliance", "ula",
  "bae systems", "general dynamics", "leidos",
  "saic", "booz allen", "maxar", "viasat", "rtx",
  "nasa", "darpa", "nro", "nga", "dia", "nsa",
  "air force research", "naval research", "army research",
  "wgs", "aehf", "muos", "gps iii", "next gen",
  "starlink", "kuiper", "o3b",
];

// Target NAICS codes for space/defense (will be assigned to kept records)
const SPACE_DEFENSE_NAICS: Record<string, string> = {
  "336414": "Guided Missile & Space Vehicle Manufacturing",
  "517410": "Satellite Telecommunications",
  "541715": "R&D in Physical/Engineering/Life Sciences",
  "334511": "Search/Detection/Navigation Instruments",
  "336415": "Guided Missile & Space Vehicle Propulsion",
  "336419": "Other Guided Missile & Space Vehicle Parts",
  "541330": "Engineering Services",
  "541512": "Computer Systems Design Services",
  "928110": "National Security",
};

function isSpaceDefenseRelevant(
  title: string | null,
  description: string | null,
  agency: string | null
): boolean {
  const text = [title, description, agency]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return SPACE_DEFENSE_KEYWORDS.some((kw) => text.includes(kw));
}

function cleanTitle(title: string | null, description: string | null): string | null {
  if (!title) return title;

  let cleaned = title;

  // Strip "THIS REQUIREMENT PROVIDES" boilerplate prefix
  const boilerplatePattern = /^THIS REQUIREMENT PROVIDES\s*/i;
  if (boilerplatePattern.test(cleaned)) {
    cleaned = cleaned.replace(boilerplatePattern, "").trim();
    // If the remainder is too short or empty, fall back to description
    if (cleaned.length < 10 && description && description.length > 10) {
      cleaned = description.replace(boilerplatePattern, "").trim();
    }
  }

  // Strip "IGF::OT::IGF" prefix
  cleaned = cleaned.replace(/^IGF::OT::IGF\s*/i, "").trim();

  // If still empty after stripping, use description
  if (!cleaned && description) {
    cleaned = description
      .replace(boilerplatePattern, "")
      .replace(/^IGF::OT::IGF\s*/i, "")
      .trim();
  }

  if (!cleaned) return title; // fallback to original

  // Apply title case if all uppercase
  const letters = cleaned.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 0 && letters === letters.toUpperCase()) {
    cleaned = cleaned
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(
        /\b(And|Or|The|In|Of|For|A|An|To|At|By|On|With)\b/g,
        (m) => m.toLowerCase()
      )
      .replace(/^./, (c) => c.toUpperCase());

    // Preserve known acronyms
    cleaned = cleaned
      .replace(/\bUs\b/g, "US")
      .replace(/\bUsa\b/g, "USA")
      .replace(/\bDod\b/g, "DoD")
      .replace(/\bNasa\b/g, "NASA")
      .replace(/\bGps\b/g, "GPS")
      .replace(/\bConus\b/g, "CONUS")
      .replace(/\bOconus\b/g, "OCONUS")
      .replace(/\bSbirs\b/g, "SBIRS")
      .replace(/\bThaad\b/g, "THAAD")
      .replace(/\bC4isr\b/g, "C4ISR")
      .replace(/\bUav\b/g, "UAV")
      .replace(/\bUas\b/g, "UAS")
      .replace(/\bRf\b/g, "RF")
      .replace(/\bIsr\b/g, "ISR")
      .replace(/\bLeo\b/g, "LEO")
      .replace(/\bMeo\b/g, "MEO")
      .replace(/\bGeo\b/g, "GEO")
      .replace(/\bIcbm\b/g, "ICBM")
      .replace(/\bWgs\b/g, "WGS")
      .replace(/\bAehf\b/g, "AEHF")
      .replace(/\bMuos\b/g, "MUOS")
      .replace(/\bIii\b/g, "III")
      .replace(/\bIi\b/g, "II");
  }

  return cleaned;
}

async function main() {
  console.log("=== Session E-2: Fix Contracts Data ===\n");

  // --- Before counts ---
  const { count: beforeCount } = await admin
    .from("gov_contracts")
    .select("*", { count: "exact", head: true });

  const { count: beforeWithCompany } = await admin
    .from("gov_contracts")
    .select("*", { count: "exact", head: true })
    .not("company_id", "is", null);

  console.log(`BEFORE: ${beforeCount} total records`);
  console.log(`  With company_id: ${beforeWithCompany}`);
  console.log(`  Without company_id: ${(beforeCount || 0) - (beforeWithCompany || 0)}`);

  // --- Step 1: Identify records to DELETE ---
  // We must batch-process because Supabase returns max 1000 rows per query
  console.log("\n--- Step 1: Identifying non-space/defense records to delete ---");

  let deleteCount = 0;
  let keepCount = 0;
  const batchSize = 500;
  let lastId: string | null = null;
  let scanned = 0;

  // Process all records without company_id in batches
  while (true) {
    let query = admin
      .from("gov_contracts")
      .select("id, contract_title, description, awarding_agency")
      .is("company_id", null)
      .order("id", { ascending: true })
      .limit(batchSize);

    if (lastId) {
      query = query.gt("id", lastId);
    }

    const { data: batch, error } = await query;
    if (error) {
      console.error("Error fetching batch:", error.message);
      break;
    }

    if (!batch || batch.length === 0) break;

    lastId = batch[batch.length - 1].id;
    scanned += batch.length;

    // Partition into keep vs delete
    const toDelete: string[] = [];
    batch.forEach((row) => {
      if (
        isSpaceDefenseRelevant(
          row.contract_title,
          row.description,
          row.awarding_agency
        )
      ) {
        keepCount++;
      } else {
        toDelete.push(row.id);
      }
    });

    // Delete non-relevant records
    if (toDelete.length > 0) {
      const { error: delErr } = await admin
        .from("gov_contracts")
        .delete()
        .in("id", toDelete);

      if (delErr) {
        console.error("Error deleting batch:", delErr.message);
        break;
      }
      deleteCount += toDelete.length;
    }

    if (scanned % 5000 === 0) {
      console.log(
        `  Scanned ${scanned} | Kept: ${keepCount} | Deleted: ${deleteCount}`
      );
    }
  }

  console.log(
    `  DONE scanning. Scanned: ${scanned} | Kept (keyword match): ${keepCount} | Deleted: ${deleteCount}`
  );

  // --- Step 2: Clean titles for remaining records ---
  console.log("\n--- Step 2: Cleaning titles ---");

  let titlesCleaned = 0;
  lastId = null;

  while (true) {
    let query = admin
      .from("gov_contracts")
      .select("id, contract_title, description")
      .order("id", { ascending: true })
      .limit(batchSize);

    if (lastId) {
      query = query.gt("id", lastId);
    }

    const { data: batch, error } = await query;
    if (error) {
      console.error("Error fetching batch:", error.message);
      break;
    }

    if (!batch || batch.length === 0) break;

    lastId = batch[batch.length - 1].id;

    // Update titles that need cleaning
    for (const row of batch) {
      const newTitle = cleanTitle(row.contract_title, row.description);
      if (newTitle && newTitle !== row.contract_title) {
        const { error: updateErr } = await admin
          .from("gov_contracts")
          .update({ contract_title: newTitle })
          .eq("id", row.id);

        if (updateErr) {
          console.error(`Error updating ${row.id}:`, updateErr.message);
        } else {
          titlesCleaned++;
        }
      }
    }
  }

  console.log(`  Titles cleaned: ${titlesCleaned}`);

  // --- Step 3: Deduplicate by contract_number ---
  console.log("\n--- Step 3: Deduplicating by contract_number ---");

  // Find duplicate contract numbers (keep highest value version)
  const { data: allContracts } = await admin
    .from("gov_contracts")
    .select("id, contract_number, contract_value")
    .order("contract_value", { ascending: false });

  if (allContracts) {
    const seen = new Map<string, string>(); // contract_number -> best id
    const dupeIds: string[] = [];

    for (const row of allContracts) {
      const key = row.contract_number || row.id; // use id if no number
      if (seen.has(key)) {
        dupeIds.push(row.id); // this is a lower-value duplicate
      } else {
        seen.set(key, row.id);
      }
    }

    if (dupeIds.length > 0) {
      // Delete in batches
      for (let i = 0; i < dupeIds.length; i += batchSize) {
        const chunk = dupeIds.slice(i, i + batchSize);
        const { error: delErr } = await admin
          .from("gov_contracts")
          .delete()
          .in("id", chunk);
        if (delErr) {
          console.error("Error deleting duplicates:", delErr.message);
        }
      }
      console.log(`  Removed ${dupeIds.length} duplicate records`);
    } else {
      console.log("  No duplicates found");
    }
  }

  // --- After counts ---
  const { count: afterCount } = await admin
    .from("gov_contracts")
    .select("*", { count: "exact", head: true });

  const now = new Date().toISOString();
  const ninetyDays = new Date(
    Date.now() + 90 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { count: expired } = await admin
    .from("gov_contracts")
    .select("*", { count: "exact", head: true })
    .lt("period_end", now);

  const { count: expiringSoon } = await admin
    .from("gov_contracts")
    .select("*", { count: "exact", head: true })
    .gte("period_end", now)
    .lt("period_end", ninetyDays);

  const { count: active } = await admin
    .from("gov_contracts")
    .select("*", { count: "exact", head: true })
    .gte("period_end", ninetyDays);

  const { count: withCompany } = await admin
    .from("gov_contracts")
    .select("*", { count: "exact", head: true })
    .not("company_id", "is", null);

  console.log("\n=== SUMMARY ===");
  console.log(`Before: ${beforeCount} records`);
  console.log(`After:  ${afterCount} records`);
  console.log(`Removed: ${(beforeCount || 0) - (afterCount || 0)} records`);
  console.log(`\nStatus distribution:`);
  console.log(`  Active (>90 days):      ${active}`);
  console.log(`  Expiring Soon (0-90d):  ${expiringSoon}`);
  console.log(`  Expired:                ${expired}`);
  console.log(`  Linked to companies:    ${withCompany}`);

  // Show a sample of cleaned records
  const { data: sample } = await admin
    .from("gov_contracts")
    .select("contract_title, awarding_agency, contract_value, period_end")
    .order("contract_value", { ascending: false })
    .limit(10);

  console.log("\nTop 10 remaining contracts by value:");
  sample?.forEach((r, i) => {
    console.log(
      `  ${i + 1}. ${r.contract_title?.slice(0, 70)} | ${r.awarding_agency} | ${formatUSD(r.contract_value)} | End: ${r.period_end}`
    );
  });

  console.log("\nDone.");
}

function formatUSD(value: number | null): string {
  if (value == null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
