/**
 * One-time cleanup script: purge ALL records from the bloated news table.
 * The table has 198K+ duplicate records from repeated NewsAPI calls.
 * After purge, call /api/v1/news/refresh to backfill clean data.
 *
 * Usage: npx tsx scripts/purge-bad-news.ts
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

async function main() {
  console.log("=== News Table Purge ===\n");

  // Delete in batches to avoid statement timeout
  let totalDeleted = 0;
  const batchSize = 500;

  while (true) {
    // Fetch a batch of IDs
    const { data: batch, error: fetchErr } = await admin
      .from("news")
      .select("id")
      .limit(batchSize);

    if (fetchErr) {
      console.error("Error fetching batch:", fetchErr.message);
      break;
    }

    if (!batch || batch.length === 0) {
      console.log("No more records to delete.");
      break;
    }

    const ids = batch.map((r) => r.id);

    const { error: deleteErr } = await admin
      .from("news")
      .delete()
      .in("id", ids);

    if (deleteErr) {
      console.error("Error deleting batch:", deleteErr.message);
      break;
    }

    totalDeleted += ids.length;
    if (totalDeleted % 5000 === 0 || batch.length < batchSize) {
      console.log(`  Deleted ${totalDeleted} records so far...`);
    }
  }

  // Verify empty
  const { data: remaining } = await admin.from("news").select("id").limit(1);

  console.log(`\n--- Summary ---`);
  console.log(`Total deleted: ${totalDeleted}`);
  console.log(`Records remaining: ${remaining?.length ?? 0}`);
  console.log("Purge complete.");
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
