import { createClient } from "@supabase/supabase-js";

// Load .env.local when running standalone
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require("dotenv").config({ path: ".env.local" });
}

interface SourceConfig {
  table: string;
  name: string;
  expectedRefreshHours: number;
}

interface SourceHealth {
  name: string;
  table: string;
  status: "green" | "yellow" | "red";
  totalRows: number;
  lastUpdated: string | null;
  hoursSinceUpdate: number | null;
  expectedRefreshHours: number;
  message: string;
}

const SOURCES: SourceConfig[] = [
  { table: "fcc_filings", name: "FCC Filings", expectedRefreshHours: 6 },
  { table: "sec_filings", name: "SEC Filings", expectedRefreshHours: 12 },
  { table: "patents", name: "Patents (USPTO)", expectedRefreshHours: 24 },
  { table: "contracts", name: "Government Contracts", expectedRefreshHours: 6 },
  { table: "orbital_data", name: "Orbital Data", expectedRefreshHours: 2 },
  { table: "news", name: "News", expectedRefreshHours: 1 },
  { table: "federal_register", name: "Federal Register", expectedRefreshHours: 24 },
  { table: "sbir_awards", name: "SBIR/STTR Awards", expectedRefreshHours: 24 },
  { table: "sam_opportunities", name: "SAM.gov Opportunities", expectedRefreshHours: 6 },
  { table: "entities", name: "Entities", expectedRefreshHours: 168 }, // weekly
  { table: "daily_briefings", name: "Daily Briefings", expectedRefreshHours: 24 },
];

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function checkSourceHealth(
  supabase: any,
  source: SourceConfig
): Promise<SourceHealth> {
  try {
    // Count total rows
    const { count, error: countError } = await supabase
      .from(source.table)
      .select("*", { count: "exact", head: true });

    if (countError) {
      return {
        name: source.name,
        table: source.table,
        status: "red",
        totalRows: 0,
        lastUpdated: null,
        hoursSinceUpdate: null,
        expectedRefreshHours: source.expectedRefreshHours,
        message: `Table not available: ${countError.message}`,
      };
    }

    const totalRows = count || 0;

    if (totalRows === 0) {
      return {
        name: source.name,
        table: source.table,
        status: "red",
        totalRows: 0,
        lastUpdated: null,
        hoursSinceUpdate: null,
        expectedRefreshHours: source.expectedRefreshHours,
        message: "Table is empty",
      };
    }

    // Find most recent record
    const { data: latestRecord, error: latestError } = await supabase
      .from(source.table)
      .select("created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (latestError || !latestRecord) {
      return {
        name: source.name,
        table: source.table,
        status: "yellow",
        totalRows,
        lastUpdated: null,
        hoursSinceUpdate: null,
        expectedRefreshHours: source.expectedRefreshHours,
        message: "Could not determine last update time",
      };
    }

    const lastUpdated =
      latestRecord.updated_at || latestRecord.created_at;
    const hoursSinceUpdate =
      (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60);

    let status: "green" | "yellow" | "red";
    let message: string;

    if (hoursSinceUpdate <= source.expectedRefreshHours) {
      status = "green";
      message = `Updated ${hoursSinceUpdate.toFixed(1)}h ago (within ${source.expectedRefreshHours}h window)`;
    } else if (hoursSinceUpdate <= source.expectedRefreshHours * 2) {
      status = "yellow";
      message = `Stale: ${hoursSinceUpdate.toFixed(1)}h since last update (expected every ${source.expectedRefreshHours}h)`;
    } else {
      status = "red";
      message = `Critical: ${hoursSinceUpdate.toFixed(1)}h since last update (expected every ${source.expectedRefreshHours}h)`;
    }

    return {
      name: source.name,
      table: source.table,
      status,
      totalRows,
      lastUpdated,
      hoursSinceUpdate: Math.round(hoursSinceUpdate * 10) / 10,
      expectedRefreshHours: source.expectedRefreshHours,
      message,
    };
  } catch (err) {
    return {
      name: source.name,
      table: source.table,
      status: "red",
      totalRows: 0,
      lastUpdated: null,
      hoursSinceUpdate: null,
      expectedRefreshHours: source.expectedRefreshHours,
      message: `Error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function sendAlertEmail(redSources: SourceHealth[]) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("[SENTINEL] No RESEND_API_KEY configured, logging alert to console:");
    console.warn("[SENTINEL] RED ALERT: The following sources need attention:");
    redSources.forEach((s) => console.warn(`  - ${s.name}: ${s.message}`));
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SENTINEL <agents@signaic.com>",
        to: "ryan@signaic.com",
        subject: `SENTINEL ALERT: ${redSources.length} data source(s) critical`,
        html: `
          <h2>SENTINEL Data Pipeline Alert</h2>
          <p>The following data sources are in critical status:</p>
          <ul>
            ${redSources.map((s) => `<li><strong>${s.name}</strong> (${s.table}): ${s.message}</li>`).join("")}
          </ul>
          <p>Check the dashboard at <a href="https://signaic.com/dashboard/data-sources">signaic.com/dashboard/data-sources</a></p>
          <p><em>Generated by SENTINEL at ${new Date().toISOString()}</em></p>
        `,
      }),
    });

    if (!response.ok) {
      console.error("[SENTINEL] Failed to send alert email:", await response.text());
    } else {
      console.log("[SENTINEL] Alert email sent to ryan@signaic.com");
    }
  } catch (err) {
    console.error("[SENTINEL] Email send error:", err);
  }
}

async function runHealthCheck(): Promise<{
  success: boolean;
  report: {
    timestamp: string;
    overall_status: "green" | "yellow" | "red";
    sources: SourceHealth[];
    summary: { total: number; green: number; yellow: number; red: number };
  };
  error?: string;
}> {
  const startTime = Date.now();
  console.log("[SENTINEL] Starting health check...");

  try {
    const supabase = createAdminClient();

    // Check all sources
    const results = await Promise.all(
      SOURCES.map((source) => checkSourceHealth(supabase, source))
    );

    const summary = {
      total: results.length,
      green: results.filter((r) => r.status === "green").length,
      yellow: results.filter((r) => r.status === "yellow").length,
      red: results.filter((r) => r.status === "red").length,
    };

    const overallStatus: "green" | "yellow" | "red" =
      summary.red > 0 ? "red" : summary.yellow > 0 ? "yellow" : "green";

    const report = {
      timestamp: new Date().toISOString(),
      overall_status: overallStatus,
      sources: results,
      summary,
    };

    // Send alert if any sources are red
    const redSources = results.filter((r) => r.status === "red");
    if (redSources.length > 0) {
      await sendAlertEmail(redSources);
    }

    // Log to agent_logs
    const logStatus =
      overallStatus === "red"
        ? "error"
        : overallStatus === "yellow"
          ? "warning"
          : "success";

    try {
      await supabase.from("agent_logs").insert({
        agent_name: "sentinel",
        run_type: "health_check",
        status: logStatus,
        summary: `Health check: ${summary.green} green, ${summary.yellow} yellow, ${summary.red} red`,
        details: {
          sources: results,
          summary,
          duration_ms: Date.now() - startTime,
        },
      });
    } catch {
      console.warn("[SENTINEL] Could not write to agent_logs (table may not exist yet)");
    }

    // Log results
    console.log(`\n[SENTINEL] === HEALTH CHECK REPORT ===`);
    console.log(`Status: ${overallStatus.toUpperCase()}`);
    console.log(`Sources: ${summary.green} green, ${summary.yellow} yellow, ${summary.red} red`);
    results.forEach((r) => {
      const icon = r.status === "green" ? "✓" : r.status === "yellow" ? "!" : "✗";
      console.log(`  [${icon}] ${r.name}: ${r.message} (${r.totalRows} rows)`);
    });
    console.log(`Duration: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

    return { success: true, report };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[SENTINEL] Health check failed:`, error);

    try {
      const supabase = createAdminClient();
      await supabase.from("agent_logs").insert({
        agent_name: "sentinel",
        run_type: "health_check",
        status: "error",
        summary: `Health check failed: ${error}`,
        details: { error, duration_ms: Date.now() - startTime },
      });
    } catch {
      // Silently fail
    }

    return {
      success: false,
      report: {
        timestamp: new Date().toISOString(),
        overall_status: "red",
        sources: [],
        summary: { total: 0, green: 0, yellow: 0, red: 0 },
      },
      error,
    };
  }
}

export { runHealthCheck };

// Run standalone
if (require.main === module) {
  runHealthCheck().then((result) => {
    if (result.success) {
      process.exit(0);
    } else {
      console.error(`\n[SENTINEL] FAILED: ${result.error}`);
      process.exit(1);
    }
  });
}
