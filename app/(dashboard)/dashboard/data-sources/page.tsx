"use client";

import { Card, StatusIndicator } from "@/components/ui";
import { Database, RefreshCw, Clock } from "lucide-react";

interface DataSource {
  name: string;
  description: string;
  lastRefresh: string;
  recordCount: string;
  status: "green" | "yellow" | "red";
  refreshFrequency: string;
}

const dataSources: DataSource[] = [
  { name: "FCC Filings", description: "Federal Communications Commission electronic filings and orders", lastRefresh: "2 hours ago", recordCount: "8,847", status: "green", refreshFrequency: "Every 6 hours" },
  { name: "SEC Filings", description: "Securities and Exchange Commission EDGAR filings", lastRefresh: "36 hours ago", recordCount: "1,203", status: "yellow", refreshFrequency: "Every 12 hours" },
  { name: "Patents (USPTO)", description: "United States Patent and Trademark Office applications and grants", lastRefresh: "4 hours ago", recordCount: "4,512", status: "green", refreshFrequency: "Daily" },
  { name: "Government Contracts", description: "Federal contract awards and modifications from FPDS", lastRefresh: "1 hour ago", recordCount: "2,341", status: "green", refreshFrequency: "Every 6 hours" },
  { name: "Orbital Data", description: "Satellite catalog, TLEs, and orbital parameters", lastRefresh: "30 minutes ago", recordCount: "45,230", status: "green", refreshFrequency: "Every 2 hours" },
  { name: "News", description: "Aggregated space and defense industry news sources", lastRefresh: "15 minutes ago", recordCount: "12,891", status: "green", refreshFrequency: "Every hour" },
  { name: "Entities", description: "Tracked companies, agencies, and programs", lastRefresh: "6 hours ago", recordCount: "2,847", status: "green", refreshFrequency: "On-demand" },
  { name: "Federal Register", description: "Federal Register notices and proposed rules", lastRefresh: "8 hours ago", recordCount: "432", status: "green", refreshFrequency: "Daily" },
  { name: "SAM.gov Opportunities", description: "System for Award Management contract opportunities", lastRefresh: "3 hours ago", recordCount: "1,567", status: "green", refreshFrequency: "Every 6 hours" },
  { name: "SBIR/STTR Awards", description: "Small Business Innovation Research awards and solicitations", lastRefresh: "12 hours ago", recordCount: "3,201", status: "green", refreshFrequency: "Daily" },
  { name: "Embeddings Index", description: "Vector embeddings for semantic search (pgvector)", lastRefresh: "1 hour ago", recordCount: "156,432", status: "green", refreshFrequency: "Continuous" },
];

export default function DataSourcesPage() {
  const healthyCount = dataSources.filter((s) => s.status === "green").length;
  const degradedCount = dataSources.filter((s) => s.status === "yellow").length;
  const totalRecords = "239,503";

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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Sources
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1 font-mono">
            {dataSources.length}
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
              {dataSources.map((source) => (
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
