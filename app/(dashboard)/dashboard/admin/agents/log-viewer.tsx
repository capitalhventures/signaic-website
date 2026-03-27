"use client";

import { useState } from "react";
import { Card, Badge } from "@/components/ui";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Filter,
} from "lucide-react";

interface AgentLogRow {
  id: string;
  agent_name: string;
  run_type: string;
  status: string;
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
}

const statusIcons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

const statusColors = {
  success: "text-emerald-600 bg-emerald-50",
  warning: "text-amber-600 bg-amber-50",
  error: "text-red-600 bg-red-50",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AgentLogViewer({ logs }: { logs: AgentLogRow[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const agentNames = Array.from(new Set(logs.map((l) => l.agent_name)));
  const filteredLogs =
    filter === "all" ? logs : logs.filter((l) => l.agent_name === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-brand-cyan" />
          Activity Log
        </h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan/20 focus:border-brand-cyan"
          >
            <option value="all">All Agents</option>
            {agentNames.map((name) => (
              <option key={name} value={name}>
                {name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card padding={false}>
        {filteredLogs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">
              No agent activity recorded
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredLogs.map((log) => {
              const StatusIcon =
                statusIcons[log.status as keyof typeof statusIcons] || Activity;
              const colorClass =
                statusColors[log.status as keyof typeof statusColors] ||
                "text-slate-500 bg-slate-50";
              const isExpanded = expandedLog === log.id;
              const hasDetails =
                log.details && Object.keys(log.details).length > 0;

              return (
                <div key={log.id}>
                  <button
                    onClick={() =>
                      setExpandedLog(isExpanded ? null : log.id)
                    }
                    className="w-full px-6 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
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
                      {timeAgo(log.created_at)}
                    </span>
                    {hasDetails && (
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>

                  {/* Expanded details */}
                  {isExpanded && hasDetails && (
                    <div className="px-6 pb-3 ml-10">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">
                          Details
                        </p>
                        <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
