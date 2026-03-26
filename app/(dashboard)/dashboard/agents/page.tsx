"use client";

import { useState, useEffect } from "react";
import { Card, Badge, StatusIndicator } from "@/components/ui";
import {
  Bot,
  Brain,
  Shield,
  Wrench,
  Play,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface AgentLog {
  id: string;
  agent_name: string;
  run_type: string;
  status: "success" | "warning" | "error";
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface AgentCard {
  name: string;
  codename: string;
  role: string;
  icon: typeof Brain;
  description: string;
  schedule: string;
  lastRun: AgentLog | null;
  endpoint: string | null;
}

const statusColors = {
  success: "text-emerald-600 bg-emerald-50",
  warning: "text-amber-600 bg-amber-50",
  error: "text-red-600 bg-red-50",
};

const statusIcons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

export default function AgentsPage() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [meridianLastRun, setMeridianLastRun] = useState<AgentLog | null>(null);
  const [sentinelLastRun, setSentinelLastRun] = useState<AgentLog | null>(null);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentData();
  }, []);

  async function fetchAgentData() {
    try {
      const res = await fetch("/api/v1/sources/status");
      if (!res.ok) return;
      const json = await res.json();

      // Try to parse agent_logs from sentinel_last_check
      if (json.data?.sentinel_last_check) {
        setSentinelLastRun({
          id: "sentinel-last",
          agent_name: "sentinel",
          run_type: "health_check",
          status: "success",
          summary: `Health check completed`,
          details: {},
          created_at: json.data.sentinel_last_check,
        });
      }

      // Check if meridian has generated today's briefing
      try {
        const briefingRes = await fetch("/api/v1/briefing");
        if (briefingRes.ok) {
          const briefingJson = await briefingRes.json();
          if (briefingJson.data?.generated_at && briefingJson.data?.id !== "sample") {
            setMeridianLastRun({
              id: "meridian-last",
              agent_name: "meridian",
              run_type: "daily_briefing",
              status: "success",
              summary: `Generated ${briefingJson.data.items?.length || 0} intelligence items`,
              details: {},
              created_at: briefingJson.data.generated_at,
            });
          }
        }
      } catch {
        // Briefing endpoint may fail
      }

      // Build a combined log
      const combinedLogs: AgentLog[] = [];
      if (json.data?.sentinel_last_check) {
        combinedLogs.push({
          id: "sentinel-log",
          agent_name: "sentinel",
          run_type: "health_check",
          status: "success",
          summary: `Sources: ${json.data.summary?.green || 0} green, ${json.data.summary?.yellow || 0} yellow, ${json.data.summary?.red || 0} red`,
          details: {},
          created_at: json.data.sentinel_last_check,
        });
      }
      setLogs(combinedLogs);
    } catch {
      // Will show placeholder data
    }
  }

  async function runAgent(agentName: string) {
    setRunningAgent(agentName);
    try {
      const res = await fetch(`/api/v1/agents/${agentName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        // Refresh data
        await fetchAgentData();
      }
    } catch {
      // Show error
    } finally {
      setRunningAgent(null);
    }
  }

  const agents: AgentCard[] = [
    {
      name: "MERIDIAN",
      codename: "meridian",
      role: "Intelligence Analyst",
      icon: Brain,
      description:
        "Synthesizes data from 9 intelligence sources into daily briefings with 3 actionable items ranked by strategic impact.",
      schedule: "Daily at 6:00 AM CT",
      lastRun: meridianLastRun,
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
      lastRun: sentinelLastRun,
      endpoint: "/api/v1/agents/sentinel",
    },
    {
      name: "ATLAS",
      codename: "atlas",
      role: "Lead Engineer",
      icon: Wrench,
      description:
        "Claude Code agent responsible for engineering, deployment, and maintaining the Signaic platform. Operates via CLAUDE.md standing orders.",
      schedule: "On-demand",
      lastRun: null,
      endpoint: null,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Bot className="w-6 h-6 text-brand-cyan" />
          Agent Operations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Signaic&apos;s autonomous agent roster. Each agent runs independently on a schedule.
        </p>
      </div>

      {/* Agent Roster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const isRunning = runningAgent === agent.codename;
          const lastStatus = agent.lastRun?.status;
          const StatusIcon = lastStatus ? statusIcons[lastStatus] : Activity;

          return (
            <Card key={agent.codename} className="flex flex-col">
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
                {lastStatus ? (
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${statusColors[lastStatus]}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <StatusIndicator status="green" pulse={false} />
                )}
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-1">
                {agent.description}
              </p>

              {/* Schedule */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                <Clock className="w-3 h-3" />
                <span>{agent.schedule}</span>
              </div>

              {/* Last Run */}
              {agent.lastRun && (
                <div className="bg-slate-50 rounded-lg p-2.5 mb-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                    Last Run
                  </p>
                  <p className="text-xs text-slate-600 truncate">
                    {agent.lastRun.summary}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(agent.lastRun.created_at).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Run Button */}
              {agent.endpoint && (
                <button
                  onClick={() => runAgent(agent.codename)}
                  disabled={isRunning}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Run Now
                    </>
                  )}
                </button>
              )}

              {!agent.endpoint && (
                <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-400 text-xs font-medium rounded-lg">
                  <Wrench className="w-3.5 h-3.5" />
                  Claude Code
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Agent Activity Log */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-brand-cyan" />
          Activity Log
        </h2>

        <Card padding={false}>
          {logs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Activity className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">
                No agent activity yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Run an agent to see activity logs here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {logs.map((log) => {
                const StatusLogIcon = statusIcons[log.status];
                return (
                  <div
                    key={log.id}
                    className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${statusColors[log.status]}`}
                    >
                      <StatusLogIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="cyan" className="text-[10px]">
                          {log.agent_name.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {log.run_type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 truncate mt-0.5">
                        {log.summary}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Agent Architecture */}
      <Card>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          Architecture Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-500">
          <div>
            <p className="font-medium text-slate-700 mb-1">Authentication</p>
            <p>
              Agent endpoints use AGENT_SECRET_KEY for machine-to-machine auth.
              User endpoints use Supabase JWT.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-1">Orchestration</p>
            <p>
              n8n Cloud Pro schedules agent runs via cron. Each agent has an HTTP
              endpoint that n8n calls on schedule.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-1">Data Access</p>
            <p>
              Agents use the Supabase service role key to bypass RLS. All writes
              are logged to the agent_logs table.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-1">Alerting</p>
            <p>
              SENTINEL sends email alerts via Resend when data sources go
              critical. MERIDIAN logs failures to agent_logs.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
