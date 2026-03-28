"use client";

import { useState, useEffect } from "react";
import { Card, StatusIndicator } from "@/components/ui";
import { Database, RefreshCw, Clock, Shield } from "lucide-react";

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

interface DataSource {
  name: string;
  description: string;
  lastRefresh: string;
  recordCount: string;
  status: "green" | "yellow" | "red";
  refreshFrequency: string;
}

const fallbackSources: DataSource[] = [
  { name: "FCC Filings", description: "Federal Communications Commission electronic filings and orders", lastRefresh: "Checking...", recordCount: "--", status: "green", refreshFrequency: "Every 6 hours" },
  { name: "SEC Filings", description: "Securities and Exchange Commission EDGAR filings", lastRefresh: "Checking...", recordCount: "--", status: "green", refreshFrequency: "Every 12 hours" },
  { name: "Patents (USPTO)", description: "United States Patent and Trademark Office applications and grants", lastRefresh: "Checking...", recordCount: "--", status: "green", refreshFrequency: "Daily" },
  { name: "Government Contracts", description: "Federal contract awards and modifications from FPDS", lastRefresh: "Checking...", recordCount: "--", status: "green", refreshFrequency: "Every 6 hours" },
  { name: "Orbital Data", description: "Satellite catalog, TLEs, and orbital parameters", lastRefresh: "Checking...", recordCount: "--", status: "green", refreshFrequency: "Every 2 hours" },
  { name: "News", description: "Aggregated space and defense industry news sources", lastRefresh: "Checking...", recordCount: "--", status: "green", refreshFrequency: "Every hour" },
  { name: "Entities", description: "Tracked companies, agencies, and programs", lastRefresh: "Checking...", recordCount: "--", status: "green", refreshFrequency: "On-demand" },
  { name: "Federal Register", description: "Federal Register notices and proposed rules", lastRefresh: "Checking...", recordCount: "--", status: "green", refreshFrequency: "Daily" },
  { name: "SAM.gov Opportunities", description: "System for Award Management contract opportunities", lastRefresh: "Checking...", recordCount: "--", status: "green", refreshFrequency: "Every 6 hours" },
  { name: "SBIR/STTR Awards", description: "Small Business Innovation Research awards and solicitations", lastRefresh: "Checking...", recordCount: "--", status: "green", refreshFrequency: "Daily" },
  { name: "Embeddings Index", description: "Vector embeddings for semantic search (pgvector)", lastRefresh: "Checking...", recordCount: "--", status: "green", refreshFrequency: "Continuous" },
];

const refreshFrequencyMap: Record<string, string> = {
  fcc_filings: "Every 6 hours",
  sec_filings: "Every 12 hours",
  patents: "Daily",
  contracts: "Every 6 hours",
  orbital_data: "Every 2 hours",
  news: "Every hour",
  federal_register: "Daily",
  sbir_awards: "Daily",
  sam_opportunities: "Every 6 hours",
  entities: "On-demand",
  daily_briefings: "Daily",
};

const descriptionMap: Record<string, string> = {
  fcc_filings: "Federal Communications Commission electronic filings and orders",
  sec_filings: "Securities and Exchange Commission EDGAR filings",
  patents: "United States Patent and Trademark Office applications and grants",
  contracts: "Federal contract awards and modifications from FPDS",
  orbital_data: "Satellite catalog, TLEs, and orbital parameters",
  news: "Aggregated space and defense industry news sources",
  federal_register: "Federal Register notices and proposed rules",
  sbir_awards: "Small Business Innovation Research awards and solicitations",
  sam_opportunities: "System for Award Management contract opportunities",
  entities: "Tracked companies, agencies, and programs",
  daily_briefings: "AI-generated daily intelligence briefings",
};

function formatLastRefresh(lastUpdated: string | null, hoursSinceUpdate: number | null): string {
  if (!lastUpdated || hoursSinceUpdate === null) return "Never";
  if (hoursSinceUpdate < 1) return `${Math.round(hoursSinceUpdate * 60)} minutes ago`;
  if (hoursSinceUpdate < 24) return `${hoursSinceUpdate.toFixed(1)} hours ago`;
  return `${Math.round(hoursSinceUpdate / 24)} days ago`;
}

export default function DataSourcesPage() {
  const [liveData, setLiveData] = useState<SourceHealth[] | null>(null);
  const [sentinelLastCheck, setSentinelLastCheck] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/v1/sources/status");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data?.sources) {
          setLiveData(json.data.sources);
          setSentinelLastCheck(json.data.sentinel_last_check || null);
          setUseFallback(false);
        }
      } catch {
        // Keep fallback data
      }
    }
    fetchStatus();
  }, []);

  const displaySources = useFallback
    ? fallbackSources
    : (liveData || []).map((s) => ({
        name: s.name,
        description: descriptionMap[s.table] || s.table,
        lastRefresh: formatLastRefresh(s.lastUpdated, s.hoursSinceUpdate),
        recordCount: s.totalRows.toLocaleString(),
        status: s.status,
        refreshFrequency: refreshFrequencyMap[s.table] || "Unknown",
      }));

  const healthyCount = displaySources.filter((s) => s.status === "green").length;
  const degradedCount = displaySources.filter((s) => s.status === "yellow").length;
  const downCount = displaySources.filter((s) => s.status === "red").length;
  const totalRecords = useFallback
    ? "--"
    : (liveData || []).reduce((sum, s) => sum + s.totalRows, 0).toLocaleString();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Database className="w-6 h-6 text-brand-cyan" />
          Data Sources Status
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Health and freshness of all intelligence data sources.
        </p>
        {sentinelLastCheck && (
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <Shield className="w-3.5 h-3.5 text-brand-cyan" />
            Last checked: {new Date(sentinelLastCheck).toLocaleString()}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <Card>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Sources
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1 font-mono">
            {displaySources.length}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Healthy
          </p>
          <p className="text-3xl font-bold text-emerald-600 mt-1 font-mono">
            {healthyCount}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Degraded
          </p>
          <p className="text-3xl font-bold text-amber-600 mt-1 font-mono">
            {degradedCount}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Down
          </p>
          <p className="text-3xl font-bold text-red-600 mt-1 font-mono">
            {downCount}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Records
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1 font-mono">
            {totalRecords}
          </p>
        </Card>
      </div>

      {/* Data Sources Table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Last Refresh
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Frequency
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displaySources.map((source) => (
                <tr
                  key={source.name}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">
                      {source.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {source.description}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <StatusIndicator status={source.status} pulse={false} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {source.lastRefresh}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-mono font-medium text-slate-900">
                      {source.recordCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 text-slate-400" />
                      {source.refreshFrequency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
