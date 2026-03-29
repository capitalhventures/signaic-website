/**
 * One-time cleanup script: purge BAD records from the news table.
 * Deletes records where title IS NULL, empty string, or "Untitled".
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
  console.log("=== News Table: Purge Bad Records ===\n");

  // Count total records before purge
  const { count: totalBefore } = await admin
    .from("news")
    .select("*", { count: "exact", head: true });
  console.log(`Total records before purge: ${totalBefore}`);

  // Count bad records (null title, empty title, or "Untitled")
  // Supabase doesn't support OR on .is() and .eq() in a single query easily,
  // so we delete in three passes.

  // Pass 1: Delete where title IS NULL
  const { data: nullTitles, error: err1 } = await admin
    .from("news")
    .delete()
    .is("title", null)
    .select("id");

  const nullCount = nullTitles?.length ?? 0;
  if (err1) console.error("Error deleting null titles:", err1.message);
  else console.log(`Deleted ${nullCount} records with NULL title`);

  // Pass 2: Delete where title = '' (empty string)
  const { data: emptyTitles, error: err2 } = await admin
    .from("news")
    .delete()
    .eq("title", "")
    .select("id");

  const emptyCount = emptyTitles?.length ?? 0;
  if (err2) console.error("Error deleting empty titles:", err2.message);
  else console.log(`Deleted ${emptyCount} records with empty title`);

  // Pass 3: Delete where title = 'Untitled'
  const { data: untitledTitles, error: err3 } = await admin
    .from("news")
    .delete()
    .eq("title", "Untitled")
    .select("id");

  const untitledCount = untitledTitles?.length ?? 0;
  if (err3) console.error("Error deleting 'Untitled' titles:", err3.message);
  else console.log(`Deleted ${untitledCount} records with title 'Untitled'`);

  // Count remaining
  const { count: totalAfter } = await admin
    .from("news")
    .select("*", { count: "exact", head: true });

  const totalDeleted = nullCount + emptyCount + untitledCount;

  console.log(`\n--- Summary ---`);
  console.log(`Total deleted: ${totalDeleted}`);
  console.log(`Records remaining: ${totalAfter}`);
  console.log("Purge complete.");
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
