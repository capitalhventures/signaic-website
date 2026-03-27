import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import {
  Brain,
  Shield,
  Wrench,
  DollarSign,
  Megaphone,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Bot,
} from "lucide-react";
import { AgentLogViewer } from "./log-viewer";

interface AgentLogRow {
  id: string;
  agent_name: string;
  run_type: string;
  status: string;
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface AgentDef {
  name: string;
  codename: string;
  role: string;
  icon: typeof Brain;
  description: string;
  schedule: string;
  status: "active" | "pending" | "error";
  endpoint: string | null;
  githubLink?: string;
}

const agents: AgentDef[] = [
  {
    name: "MERIDIAN",
    codename: "meridian",
    role: "Intelligence Analyst",
    icon: Brain,
    description:
      "Synthesizes data from 9 intelligence sources into daily briefings with 3 actionable items ranked by strategic impact.",
    schedule: "Daily at 6:00 AM CT",
    status: "active",
    endpoint: "/api/v1/agents/meridian",
  },
  {
    name: "SENTINEL",
    codename: "sentinel",
    role: "Data Pipeline Manager",
    icon: Shield,
    description:
      "Monitors 11 data source tables for freshness, verifies row counts, detects anomalies, and sends alerts for critical issues.",
    schedule: "Every 6 hours",
    status: "active",
    endpoint: "/api/v1/agents/sentinel",
  },
  {
    name: "ATLAS",
    codename: "atlas",
    role: "Lead Engineer",
    icon: Wrench,
    description:
      "Claude Code agent responsible for engineering, deployment, and maintenance. Operates via CLAUDE.md standing orders in the repository.",
    schedule: "On-demand (Claude Code)",
    status: "active",
    endpoint: null,
    githubLink: "https://github.com/capitalhventures/signaic-website",
  },
  {
    name: "LEDGER",
    codename: "ledger",
    role: "Financial Analyst",
    icon: DollarSign,
    description:
      "Financial tracking, MRR monitoring, cost analysis, and runway forecasting. Integrates with Stripe and accounting APIs.",
    schedule: "TBD",
    status: "pending",
    endpoint: null,
  },
  {
    name: "VECTOR",
    codename: "vector",
    role: "Content & GTM Manager",
    icon: Megaphone,
    description:
      "Content generation, marketing automation, and go-to-market execution. Manages email campaigns, social content, and investor updates.",
    schedule: "TBD",
    status: "pending",
    endpoint: null,
  },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-slate-100 text-slate-500 border-slate-200",
  error: "bg-red-50 text-red-700 border-red-200",
};

const logStatusIcons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const logStatusColors = {
  success: "text-emerald-600 bg-emerald-50",
  warning: "text-amber-600 bg-amber-50",
  error: "text-red-600 bg-red-50",
};

export default async function AgentsDashboardPage() {
  const supabase = createClient();

  // Fetch all agent logs
  const { data: allLogs } = await supabase
    .from("agent_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const logs = (allLogs || []) as AgentLogRow[];

  // Group logs by agent
  const logsByAgent: Record<string, AgentLogRow[]> = {};
  for (const log of logs) {
    if (!logsByAgent[log.agent_name]) {
      logsByAgent[log.agent_name] = [];
    }
    logsByAgent[log.agent_name].push(log);
  }

  // Get last run for each agent
  const lastRunByAgent: Record<string, AgentLogRow | undefined> = {};
  for (const agent of agents) {
    lastRunByAgent[agent.codename] = logsByAgent[agent.codename]?.[0];
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Bot className="w-6 h-6 text-brand-cyan" />
          Agent Operations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          All 5 Signaic agents — status, schedules, and activity logs.
        </p>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const lastRun = lastRunByAgent[agent.codename];

          return (
            <Card key={agent.codename} className="flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-cyan" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-display tracking-wider">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-brand-cyan font-medium">
                      {agent.role}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${statusStyles[agent.status]}`}
                >
                  {agent.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-1">
                {agent.description}
              </p>

              {/* Schedule */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                <Clock className="w-3 h-3" />
                <span>{agent.schedule}</span>
              </div>

              {/* Last Run */}
              {lastRun && (
                <div className="bg-slate-50 rounded-lg p-2.5 mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Last Activity
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {timeAgo(lastRun.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const StatusIcon =
                        logStatusIcons[
                          lastRun.status as keyof typeof logStatusIcons
                        ] || Activity;
                      const colorClass =
                        logStatusColors[
                          lastRun.status as keyof typeof logStatusColors
                        ] || "text-slate-500 bg-slate-50";
                      return (
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${colorClass}`}
                        >
                          <StatusIcon className="w-2.5 h-2.5" />
                        </div>
                      );
                    })()}
                    <p className="text-xs text-slate-600 truncate">
                      {lastRun.summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Pending status message */}
              {agent.status === "pending" && !lastRun && (
                <div className="bg-slate-50 rounded-lg p-2.5 mb-3 text-center">
                  <p className="text-xs text-slate-400">
                    Pending Configuration
                  </p>
                </div>
              )}

              {/* GitHub link for ATLAS */}
              {agent.githubLink && (
                <a
                  href={agent.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  GitHub Repository
                </a>
              )}

              {/* Endpoint info */}
              {agent.endpoint && (
                <div className="text-[10px] text-slate-400 font-mono mt-2 truncate">
                  {agent.endpoint}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Full Activity Log with collapsible viewer */}
      <AgentLogViewer logs={logs} />
    </div>
  );
}
