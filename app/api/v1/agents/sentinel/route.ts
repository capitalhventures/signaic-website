import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-utils";
import { createAdminClient } from "@/lib/supabase/admin";

const SOURCES = [
  { table: "fcc_filings", name: "FCC Filings", expectedRefreshHours: 6 },
  { table: "sec_filings", name: "SEC Filings", expectedRefreshHours: 12 },
  { table: "patents", name: "Patents (USPTO)", expectedRefreshHours: 24 },
  { table: "contracts", name: "Government Contracts", expectedRefreshHours: 6 },
  { table: "orbital_data", name: "Orbital Data", expectedRefreshHours: 2 },
  { table: "news", name: "News", expectedRefreshHours: 1 },
  { table: "federal_register", name: "Federal Register", expectedRefreshHours: 24 },
  { table: "sbir_awards", name: "SBIR/STTR Awards", expectedRefreshHours: 24 },
  { table: "sam_opportunities", name: "SAM.gov Opportunities", expectedRefreshHours: 6 },
  { table: "entities", name: "Entities", expectedRefreshHours: 168 },
  { table: "daily_briefings", name: "Daily Briefings", expectedRefreshHours: 24 },
];

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

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || token !== process.env.AGENT_SECRET_KEY) {
    return apiError("Unauthorized", 401);
  }

  const startTime = Date.now();

  try {
    const supabase = createAdminClient();
    const results: SourceHealth[] = [];

    for (const source of SOURCES) {
      try {
        const { count, error: countError } = await supabase
          .from(source.table)
          .select("*", { count: "exact", head: true });

        if (countError) {
          results.push({
            name: source.name,
            table: source.table,
            status: "red",
            totalRows: 0,
            lastUpdated: null,
            hoursSinceUpdate: null,
            expectedRefreshHours: source.expectedRefreshHours,
            message: `Table not available: ${countError.message}`,
          });
          continue;
        }

        const totalRows = count || 0;

        if (totalRows === 0) {
          results.push({
            name: source.name,
            table: source.table,
            status: "red",
            totalRows: 0,
            lastUpdated: null,
            hoursSinceUpdate: null,
            expectedRefreshHours: source.expectedRefreshHours,
            message: "Table is empty",
          });
          continue;
        }

        const { data: latestRecord } = await supabase
          .from(source.table)
          .select("created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const lastUpdated = latestRecord?.updated_at || latestRecord?.created_at || null;
        const hoursSinceUpdate = lastUpdated
          ? (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60)
          : null;

        let status: "green" | "yellow" | "red";
        let message: string;

        if (hoursSinceUpdate === null) {
          status = "yellow";
          message = "Could not determine last update time";
        } else if (hoursSinceUpdate <= source.expectedRefreshHours) {
          status = "green";
          message = `Updated ${hoursSinceUpdate.toFixed(1)}h ago`;
        } else if (hoursSinceUpdate <= source.expectedRefreshHours * 2) {
          status = "yellow";
          message = `Stale: ${hoursSinceUpdate.toFixed(1)}h since last update`;
        } else {
          status = "red";
          message = `Critical: ${hoursSinceUpdate.toFixed(1)}h since last update`;
        }

        results.push({
          name: source.name,
          table: source.table,
          status,
          totalRows,
          lastUpdated,
          hoursSinceUpdate: hoursSinceUpdate ? Math.round(hoursSinceUpdate * 10) / 10 : null,
          expectedRefreshHours: source.expectedRefreshHours,
          message,
        });
      } catch {
        results.push({
          name: source.name,
          table: source.table,
          status: "red",
          totalRows: 0,
          lastUpdated: null,
          hoursSinceUpdate: null,
          expectedRefreshHours: source.expectedRefreshHours,
          message: "Error checking source",
        });
      }
    }

    const summary = {
      total: results.length,
      green: results.filter((r) => r.status === "green").length,
      yellow: results.filter((r) => r.status === "yellow").length,
      red: results.filter((r) => r.status === "red").length,
    };

    const overallStatus: "green" | "yellow" | "red" =
      summary.red > 0 ? "red" : summary.yellow > 0 ? "yellow" : "green";

    // Send alert email if any sources are red
    const redSources = results.filter((r) => r.status === "red");
    if (redSources.length > 0 && process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "SENTINEL <agents@signaic.com>",
            to: "ryan@signaic.com",
            subject: `SENTINEL ALERT: ${redSources.length} data source(s) critical`,
            html: `<h2>SENTINEL Alert</h2><ul>${redSources.map((s) => `<li><strong>${s.name}</strong>: ${s.message}</li>`).join("")}</ul>`,
          }),
        });
      } catch {
        // Email send is best-effort
      }
    }

    // Log to agent_logs
    const logStatus = overallStatus === "red" ? "error" : overallStatus === "yellow" ? "warning" : "success";
    try {
      await supabase.from("agent_logs").insert({
        agent_name: "sentinel",
        run_type: "health_check",
        status: logStatus,
        summary: `Health check: ${summary.green} green, ${summary.yellow} yellow, ${summary.red} red`,
        details: { sources: results, summary, duration_ms: Date.now() - startTime },
      });
    } catch {
      // agent_logs table may not exist yet
    }

    return apiResponse({
      timestamp: new Date().toISOString(),
      overall_status: overallStatus,
      sources: results,
      summary,
      duration_ms: Date.now() - startTime,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return apiError(`Sentinel failed: ${error}`, 500);
  }
}
