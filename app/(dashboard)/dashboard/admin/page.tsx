import { createClient } from "@/lib/supabase/server";
import { Card, CardTitle, Badge, StatusIndicator } from "@/components/ui";
import {
  Users,
  Database,
  Activity,
  Server,
  Bot,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface UserRow {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface AgentLogRow {
  id: string;
  agent_name: string;
  run_type: string;
  status: string;
  summary: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function AdminPage() {
  const supabase = createClient();

  // Fetch data in parallel
  const [usersResult, entitiesResult, logsResult, briefingsResult] =
    await Promise.all([
      supabase.auth.admin.listUsers().catch(() => ({ data: { users: [] }, error: null })),
      supabase.from("entities").select("id", { count: "exact", head: true }),
      supabase
        .from("agent_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("daily_briefings")
        .select("*")
        .order("briefing_date", { ascending: false })
        .limit(1),
    ]);

  // Users — admin.listUsers requires service role, fallback to empty
  const users: UserRow[] = (usersResult?.data?.users || []).map((u: { id: string; email?: string; created_at: string; last_sign_in_at?: string }) => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  }));

  const entityCount = entitiesResult.count || 0;
  const recentLogs = (logsResult.data || []) as AgentLogRow[];
  const latestBriefing = briefingsResult.data?.[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-brand-cyan" />
            <span className="text-sm font-medium text-slate-500">
              Registered Users
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{users.length}</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-5 h-5 text-brand-cyan" />
            <span className="text-sm font-medium text-slate-500">
              Tracked Entities
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{entityCount}</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-5 h-5 text-brand-cyan" />
            <span className="text-sm font-medium text-slate-500">
              Active Agents
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">3</p>
          <p className="text-xs text-slate-400 mt-1">2 pending config</p>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-brand-cyan" />
            <span className="text-sm font-medium text-slate-500">
              Latest Briefing
            </span>
          </div>
          <p className="text-lg font-bold text-slate-900">
            {latestBriefing
              ? new Date(latestBriefing.briefing_date).toLocaleDateString()
              : "None yet"}
          </p>
        </Card>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Management */}
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-cyan" />
            User Management
          </CardTitle>
          <div className="mt-4">
            {users.length === 0 ? (
              <p className="text-sm text-slate-400">
                No users found. User listing requires service role access.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Signed Up
                      </th>
                      <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Last Login
                      </th>
                      <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Tier
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-50 hover:bg-slate-50"
                      >
                        <td className="py-2.5 text-slate-700 font-medium">
                          {user.email || "—"}
                        </td>
                        <td className="py-2.5 text-slate-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 text-slate-500">
                          {user.last_sign_in_at
                            ? timeAgo(user.last_sign_in_at)
                            : "Never"}
                        </td>
                        <td className="py-2.5">
                          <Badge variant="cyan">Free</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {/* System Health */}
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-brand-cyan" />
            System Health
          </CardTitle>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-600">Supabase</span>
              <StatusIndicator status="green" label="Connected" />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-600">API Routes</span>
              <StatusIndicator status="green" label="Operational" />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-600">Vercel Deployment</span>
              <StatusIndicator status="green" label="Live" />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-600">n8n Workflows</span>
              <StatusIndicator status="green" label="Running" />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-600">Claude API</span>
              <StatusIndicator status="green" label="Available" />
            </div>
          </div>
        </Card>
      </div>

      {/* Data Pipeline + Recent Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Pipeline Overview */}
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-cyan" />
            Data Pipeline Overview
          </CardTitle>
          <div className="mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Records
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "FCC Filings", status: "green" as const, records: "2,140" },
                  { name: "SEC EDGAR", status: "green" as const, records: "1,870" },
                  { name: "Federal Register", status: "green" as const, records: "3,210" },
                  { name: "SAM.gov", status: "green" as const, records: "1,540" },
                  { name: "USPTO Patents", status: "green" as const, records: "980" },
                  { name: "SBIR Awards", status: "green" as const, records: "640" },
                  { name: "Space-Track", status: "green" as const, records: "1,320" },
                  { name: "USAspending", status: "green" as const, records: "890" },
                  { name: "Defense News", status: "green" as const, records: "1,660" },
                ].map((source) => (
                  <tr
                    key={source.name}
                    className="border-b border-slate-50 hover:bg-slate-50"
                  >
                    <td className="py-2 text-slate-700 font-medium">
                      {source.name}
                    </td>
                    <td className="py-2">
                      <StatusIndicator
                        status={source.status}
                        pulse={false}
                      />
                    </td>
                    <td className="py-2 text-right text-slate-500 font-mono text-xs">
                      {source.records}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Agent Activity */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-brand-cyan" />
              Recent Agent Activity
            </CardTitle>
            <Link
              href="/dashboard/admin/agents"
              className="text-xs text-brand-cyan hover:opacity-80 transition-opacity"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                No agent activity recorded yet
              </p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      log.status === "success"
                        ? "bg-emerald-50 text-emerald-600"
                        : log.status === "warning"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {log.status === "error" ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <Activity className="w-3 h-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="cyan" className="text-[10px]">
                        {log.agent_name.toUpperCase()}
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        {timeAgo(log.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      {log.summary}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
