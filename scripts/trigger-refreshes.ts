/**
 * Session E-FIX: Trigger all data source refresh endpoints.
 * Runs each refresh sequentially and reports results.
 *
 * Usage: npx tsx scripts/trigger-refreshes.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const samApiKey = process.env.SAM_GOV_API_KEY;
const newsApiKey = process.env.NEWSAPI_KEY;
const spaceTrackUser = process.env.SPACE_TRACK_USERNAME;
const spaceTrackPass = process.env.SPACE_TRACK_PASSWORD;

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface RefreshResult {
  source: string;
  status: "success" | "error" | "stub" | "skipped";
  records?: number;
  message?: string;
}

const results: RefreshResult[] = [];

// ─── NEWS (NewsAPI) ──────────────────────────────────────────────────────────
async function refreshNews() {
  if (!newsApiKey) {
    results.push({ source: "news", status: "skipped", message: "NEWSAPI_KEY not set" });
    return;
  }

  const queries = [
    "space defense satellite",
    "aerospace SpaceX launch",
    "military satellite defense contractor",
  ];

  let totalInserted = 0;
  for (const q of queries) {
    const params = new URLSearchParams({
      q,
      language: "en",
      sortBy: "publishedAt",
      pageSize: "50",
      apiKey: newsApiKey,
    });

    try {
      const res = await fetch(`https://newsapi.org/v2/everything?${params}`);
      if (!res.ok) continue;
      const json = await res.json();
      const articles = json.articles || [];

      const rows = articles
        .filter((a: { title?: string; url?: string }) => a.title && a.url)
        .map((a: { title: string; url: string; source?: { name?: string }; author?: string; urlToImage?: string; publishedAt?: string; description?: string }) => ({
          title: a.title,
          url: a.url,
          source_name: a.source?.name || null,
          author: a.author || null,
          image_url: a.urlToImage || null,
          published_at: a.publishedAt || null,
          description: a.description?.slice(0, 2000) || null,
        }));

      if (rows.length > 0) {
        const { error } = await admin
          .from("news")
          .upsert(rows, { onConflict: "url", ignoreDuplicates: true });
        if (!error) totalInserted += rows.length;
      }
    } catch {
      continue;
    }
  }

  results.push({ source: "news", status: "success", records: totalInserted });
}

// ─── RSS FEEDS ───────────────────────────────────────────────────────────────
async function refreshRSS() {
  const feeds = [
    { name: "SpaceNews", source: "SpaceNews", url: "https://spacenews.com/feed/" },
    { name: "Via Satellite", source: "Via Satellite", url: "https://www.satellitetoday.com/feed/" },
    { name: "Defense One", source: "Defense One", url: "https://www.defenseone.com/rss/all" },
    { name: "SpaceFlightNow", source: "SpaceFlightNow", url: "https://spaceflightnow.com/feed/" },
    { name: "Space.com", source: "Space.com", url: "https://www.space.com/feeds/all" },
  ];

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "Signaic/1.0 (RSS Feed Reader)" },
      });
      if (!res.ok) {
        results.push({ source: `rss_${feed.name}`, status: "error", message: `HTTP ${res.status}` });
        continue;
      }
      const xml = await res.text();

      // Simple RSS item extraction
      const items: Array<{ title: string; url: string; description: string; author: string; published_at: string }> = [];
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];
        const title = extractTag(itemXml, "title");
        const link = extractTag(itemXml, "link");
        const desc = extractTag(itemXml, "description");
        const author = extractTag(itemXml, "dc:creator") || extractTag(itemXml, "author");
        const pubDate = extractTag(itemXml, "pubDate");
        if (title && link) {
          items.push({
            title: decodeEntities(title),
            url: link.trim(),
            description: decodeEntities(desc || "").slice(0, 2000),
            author: author || "",
            published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          });
        }
      }

      // Also try Atom <entry> format
      const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
      while ((match = entryRegex.exec(xml)) !== null) {
        const entryXml = match[1];
        const title = extractTag(entryXml, "title");
        const linkMatch = entryXml.match(/<link[^>]*href="([^"]*)"[^>]*\/?>/);
        const link = linkMatch ? linkMatch[1] : extractTag(entryXml, "link");
        const desc = extractTag(entryXml, "summary") || extractTag(entryXml, "content");
        const author = extractTag(entryXml, "name");
        const pubDate = extractTag(entryXml, "published") || extractTag(entryXml, "updated");
        if (title && link) {
          items.push({
            title: decodeEntities(title),
            url: link.trim(),
            description: decodeEntities(desc || "").slice(0, 2000),
            author: author || "",
            published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          });
        }
      }

      if (items.length === 0) {
        results.push({ source: `rss_${feed.name}`, status: "error", message: "No items parsed" });
        continue;
      }

      const rows = items.map((item) => ({
        source: feed.source,
        title: item.title,
        description: item.description,
        url: item.url,
        author: item.author || null,
        published_at: item.published_at,
      }));

      const { error } = await admin
        .from("rss_feeds")
        .upsert(rows, { onConflict: "url", ignoreDuplicates: true });

      results.push({
        source: `rss_${feed.name}`,
        status: error ? "error" : "success",
        records: items.length,
        message: error?.message,
      });
    } catch (err) {
      results.push({
        source: `rss_${feed.name}`,
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }
}

// ─── SAM.GOV ─────────────────────────────────────────────────────────────────
async function refreshSAM() {
  if (!samApiKey) {
    results.push({ source: "sam", status: "skipped", message: "SAM_GOV_API_KEY not set" });
    return;
  }

  const naicsCodes = ["336414", "517410", "541715", "334511"];
  let totalInserted = 0;

  for (const naics of naicsCodes) {
    const d = new Date();
    const today = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
    const ago = new Date(Date.now() - 90 * 86400000);
    const daysAgo = `${String(ago.getMonth() + 1).padStart(2, "0")}/${String(ago.getDate()).padStart(2, "0")}/${ago.getFullYear()}`;

    const params = new URLSearchParams({
      api_key: samApiKey,
      postedFrom: daysAgo,
      postedTo: today,
      ncode: naics,
      limit: "100",
    });

    try {
      const res = await fetch(`https://api.sam.gov/opportunities/v2/search?${params}`);
      if (!res.ok) {
        console.log(`  SAM NAICS ${naics}: HTTP ${res.status}`);
        continue;
      }
      const json = await res.json();
      const opps = json.opportunitiesData || json.opportunities || [];
      if (opps.length === 0) continue;

      const rows = opps.map((o: {
        solicitationNumber?: string; noticeId: string; title: string;
        fullParentPathName?: string; description?: string; naicsCode?: string;
        pscCode?: string; postedDate?: string; responseDeadLine?: string;
        type?: string; setAside?: string;
        placeOfPerformance?: { city?: { name?: string }; state?: { name?: string } };
        uiLink?: string; award?: { amount?: number };
      }) => ({
        solicitation_number: o.solicitationNumber || o.noticeId,
        title: o.title || "Untitled",
        agency: o.fullParentPathName || null,
        description: o.description?.slice(0, 5000) || null,
        naics_code: o.naicsCode || naics,
        psc_code: o.pscCode || null,
        posted_date: o.postedDate || null,
        response_deadline: o.responseDeadLine || null,
        opportunity_type: o.type || null,
        set_aside_type: o.setAside || null,
        place_of_performance: o.placeOfPerformance
          ? [o.placeOfPerformance.city?.name, o.placeOfPerformance.state?.name].filter(Boolean).join(", ")
          : null,
        sam_gov_url: o.uiLink || `https://sam.gov/opp/${o.noticeId}/view`,
        estimated_value: o.award?.amount || null,
        active: true,
      }));

      const solNums = rows.map((r: { solicitation_number: string }) => r.solicitation_number).filter(Boolean);
      const { data: existing } = await admin
        .from("sam_opportunities")
        .select("solicitation_number")
        .in("solicitation_number", solNums);
      const existingNums = new Set((existing ?? []).map((r) => r.solicitation_number));
      const newRows = rows.filter((r: { solicitation_number: string }) => !existingNums.has(r.solicitation_number));

      if (newRows.length > 0) {
        const { error } = await admin.from("sam_opportunities").insert(newRows);
        if (!error) totalInserted += newRows.length;
      }
    } catch {
      continue;
    }
  }

  results.push({ source: "sam", status: "success", records: totalInserted });
}

// ─── CONTRACTS (USASpending) ─────────────────────────────────────────────────
async function refreshContracts() {
  const naicsCodes = ["336414", "517410", "541715", "334511", "336415", "336419", "541330", "541512", "928110"];
  let totalInserted = 0;

  for (const naics of naicsCodes) {
    const today = new Date().toISOString().split("T")[0];
    const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];

    const body = {
      filters: {
        time_period: [{ start_date: yearAgo, end_date: today }],
        award_type_codes: ["A", "B", "C", "D"],
        naics_codes: { require: [naics] },
      },
      fields: [
        "Award ID", "Award Type", "Awarding Agency", "Awarding Sub Agency",
        "Recipient Name", "Description", "Award Amount", "Total Outlays",
        "Start Date", "End Date", "generated_internal_id", "NAICS Code",
      ],
      limit: 50,
      page: 1,
      sort: "Award Amount",
      order: "desc",
    };

    try {
      const res = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) continue;

      const json = await res.json();
      const rawResults = json.results || [];
      if (rawResults.length === 0) continue;

      const rows = rawResults
        .filter((r: Record<string, unknown>) => r["Recipient Name"] && r["Description"])
        .map((r: Record<string, unknown>) => ({
          contract_number: (r["Award ID"] as string) || null,
          awarding_agency: (r["Awarding Agency"] as string) || (r["Awarding Sub Agency"] as string) || null,
          contract_title: ((r["Description"] as string) || "").slice(0, 200),
          contract_value: (r["Award Amount"] as number) || (r["Total Outlays"] as number) || null,
          period_start: (r["Start Date"] as string) || null,
          period_end: (r["End Date"] as string) || null,
          contract_type: (r["Award Type"] as string) || null,
          description: ((r["Description"] as string) || "").slice(0, 5000),
          naics_code: (r["NAICS Code"] as string) || naics,
          source_url: (r["generated_internal_id"] as string)
            ? `https://www.usaspending.gov/award/${r["generated_internal_id"]}`
            : null,
          contractor_name: (r["Recipient Name"] as string) || null,
        }));

      const contractNums = rows.map((r: { contract_number: string | null }) => r.contract_number).filter(Boolean) as string[];
      if (contractNums.length > 0) {
        const { data: existing } = await admin
          .from("gov_contracts")
          .select("contract_number")
          .in("contract_number", contractNums);
        const existingNums = new Set((existing ?? []).map((r) => r.contract_number));
        const newRows = rows.filter((r: { contract_number: string | null }) => !r.contract_number || !existingNums.has(r.contract_number));
        if (newRows.length > 0) {
          const { error } = await admin.from("gov_contracts").insert(newRows);
          if (!error) totalInserted += newRows.length;
          else console.log(`  Contracts insert error: ${error.message}`);
        }
      } else if (rows.length > 0) {
        const { error } = await admin.from("gov_contracts").insert(rows);
        if (!error) totalInserted += rows.length;
      }
    } catch {
      continue;
    }
  }

  results.push({ source: "contracts", status: "success", records: totalInserted });
}

// ─── ORBITAL (Space-Track) ───────────────────────────────────────────────────
async function refreshOrbital() {
  if (!spaceTrackUser || !spaceTrackPass) {
    results.push({ source: "orbital", status: "skipped", message: "Space-Track credentials not set" });
    return;
  }

  try {
    const loginRes = await fetch("https://www.space-track.org/ajaxauth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ identity: spaceTrackUser, password: spaceTrackPass }),
    });
    if (!loginRes.ok) {
      results.push({ source: "orbital", status: "error", message: "Login failed" });
      return;
    }
    const cookies = loginRes.headers.getSetCookie?.() || [];
    const cookieHeader = cookies.join("; ");

    const queryUrl = "https://www.space-track.org/basicspacedata/query/class/gp/DECAY_DATE/null-val/OBJECT_TYPE/PAYLOAD/orderby/LAUNCH_DATE desc/limit/200/format/json";
    const dataRes = await fetch(queryUrl, { headers: { Cookie: cookieHeader } });
    if (!dataRes.ok) {
      results.push({ source: "orbital", status: "error", message: `Data fetch failed: ${dataRes.status}` });
      return;
    }

    const records = await dataRes.json();
    const rows = records.map((r: Record<string, string | null>) => ({
      norad_cat_id: r.NORAD_CAT_ID,
      object_name: r.OBJECT_NAME,
      object_type: r.OBJECT_TYPE || "PAYLOAD",
      orbit_type: classifyOrbit(parseFloat(r.PERIOD || "0"), parseFloat(r.INCLINATION || "0")),
      launch_date: r.LAUNCH_DATE || null,
      period: parseFloat(r.PERIOD || "0") || null,
      inclination: parseFloat(r.INCLINATION || "0") || null,
      apoapsis: parseFloat(r.APOAPSIS || "0") || null,
      periapsis: parseFloat(r.PERIAPSIS || "0") || null,
      current_status: r.DECAY_DATE ? "Decayed" : "Active",
      updated_at: new Date().toISOString(),
    }));

    let totalUpserted = 0;
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await admin.from("orbital_data").upsert(batch, { onConflict: "norad_cat_id" });
      if (!error) totalUpserted += batch.length;
    }

    results.push({ source: "orbital", status: "success", records: totalUpserted });
  } catch (err) {
    results.push({ source: "orbital", status: "error", message: err instanceof Error ? err.message : "Unknown" });
  }
}

// ─── STUBS ───────────────────────────────────────────────────────────────────
function logStubs() {
  const stubs = ["sec", "fcc", "patents", "federal_register", "sbir"];
  for (const s of stubs) {
    results.push({ source: s, status: "stub", message: "Refresh not yet implemented" });
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function extractTag(xml: string, tag: string): string {
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i"));
  if (cdataMatch) return cdataMatch[1].trim();
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "\u2019")
    .replace(/<[^>]+>/g, "");
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

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Triggering All Data Source Refreshes ===\n");

  console.log("1/6 Refreshing News...");
  await refreshNews();
  console.log(`  -> ${results[results.length - 1].status}: ${results[results.length - 1].records || 0} records\n`);

  console.log("2/6 Refreshing RSS Feeds...");
  await refreshRSS();
  const rssResults = results.filter((r) => r.source.startsWith("rss_"));
  rssResults.forEach((r) => console.log(`  -> ${r.source}: ${r.status} (${r.records || 0} items)`));
  console.log();

  console.log("3/6 Refreshing SAM.gov...");
  await refreshSAM();
  console.log(`  -> ${results[results.length - 1].status}: ${results[results.length - 1].records || 0} records\n`);

  console.log("4/6 Refreshing Contracts (USASpending)...");
  await refreshContracts();
  console.log(`  -> ${results[results.length - 1].status}: ${results[results.length - 1].records || 0} records\n`);

  console.log("5/6 Refreshing Orbital (Space-Track)...");
  await refreshOrbital();
  console.log(`  -> ${results[results.length - 1].status}: ${results[results.length - 1].records || 0} records\n`);

  console.log("6/6 Logging stubs...");
  logStubs();
  results.filter((r) => r.status === "stub").forEach((r) => console.log(`  -> ${r.source}: stub (not implemented)`));

  console.log("\n=== Summary ===");
  console.log(`Total sources processed: ${results.length}`);
  console.log(`  Success: ${results.filter((r) => r.status === "success").length}`);
  console.log(`  Stubs:   ${results.filter((r) => r.status === "stub").length}`);
  console.log(`  Errors:  ${results.filter((r) => r.status === "error").length}`);
  console.log(`  Skipped: ${results.filter((r) => r.status === "skipped").length}`);

  // Log cron executions
  for (const r of results) {
    if (r.status === "success" || r.status === "error") {
      await admin.from("cron_logs").insert({
        source: r.source,
        status: r.status,
        records_processed: r.records || 0,
        error_message: r.message || null,
        executed_at: new Date().toISOString(),
      });
    }
  }

  console.log("\nCron logs saved.");
}

main().catch(console.error);
