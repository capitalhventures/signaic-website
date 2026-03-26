"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge, EntityTag, StatusIndicator, Citation } from "@/components/ui";
import {
  Zap,
  Eye,
  ArrowRight,
  Send,
  Database,
  FileText,
  Clock,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface BriefingEntity {
  id?: string;
  name: string;
  slug: string;
  type: "company" | "agency" | "program";
}

interface BriefingSource {
  id: string;
  title: string;
  type: string;
  url: string;
}

interface BriefingItem {
  headline: string;
  synthesis: string;
  entities: BriefingEntity[];
  impact: "high" | "medium" | "low";
  sources: BriefingSource[];
}

// Sample briefing data (fallback when no real briefing exists)
const sampleBriefingItems: BriefingItem[] = [
  {
    headline: "SpaceX Secures $1.8B NRO Launch Contract Extension",
    synthesis:
      "The National Reconnaissance Office has extended its launch services contract with SpaceX by $1.8 billion through 2028. This solidifies SpaceX's position as the primary launch provider for classified payloads and may impact ULA's competitive positioning for future NSSL Phase 3 awards.",
    entities: [
      { id: "1", name: "SpaceX", slug: "spacex", type: "company" },
      { id: "2", name: "NRO", slug: "nro", type: "agency" },
      { id: "3", name: "ULA", slug: "ula", type: "company" },
    ],
    impact: "high",
    sources: [
      { id: "s1", title: "NRO Contract Award Notice", type: "contract", url: "#" },
      { id: "s2", title: "SAM.gov Opportunity FA8811-24-R-0001", type: "sam", url: "#" },
    ],
  },
  {
    headline: "FCC Approves Kuiper Gen2 Constellation Modification",
    synthesis:
      "Amazon's Project Kuiper received FCC approval for its Gen2 constellation modification, allowing deployment of 7,774 satellites across revised orbital shells. This directly competes with Starlink's V2 Mini constellation and signals accelerating commercial broadband competition in LEO.",
    entities: [
      { id: "4", name: "Amazon Kuiper", slug: "amazon-kuiper", type: "program" },
      { id: "5", name: "FCC", slug: "fcc", type: "agency" },
      { id: "6", name: "SpaceX Starlink", slug: "spacex-starlink", type: "program" },
    ],
    impact: "high",
    sources: [
      { id: "s3", title: "FCC Order DA-24-1847", type: "fcc", url: "#" },
      { id: "s4", title: "Federal Register Notice Vol. 89", type: "federal_register", url: "#" },
    ],
  },
  {
    headline: "L3Harris Patents New Satellite Servicing Mechanism",
    synthesis:
      "L3Harris Technologies filed a patent for an autonomous satellite servicing mechanism designed for GEO orbit operations. This aligns with DARPA's RSGS program requirements and positions L3Harris ahead of Northrop Grumman's MEV technology in the on-orbit servicing market.",
    entities: [
      { id: "7", name: "L3Harris", slug: "l3harris", type: "company" },
      { id: "8", name: "DARPA", slug: "darpa", type: "agency" },
      { id: "9", name: "Northrop Grumman", slug: "northrop-grumman", type: "company" },
    ],
    impact: "medium",
    sources: [
      { id: "s5", title: "USPTO Patent Application 2024/0187432", type: "patent", url: "#" },
      { id: "s6", title: "DARPA RSGS Program Update", type: "news", url: "#" },
    ],
  },
];

const watchlistAlerts = [
  {
    entity: "SpaceX",
    alertType: "New Contract",
    timestamp: "2 hours ago",
    source: "SAM.gov",
  },
  {
    entity: "Rocket Lab",
    alertType: "SEC Filing",
    timestamp: "5 hours ago",
    source: "SEC EDGAR",
  },
  {
    entity: "Amazon Kuiper",
    alertType: "FCC Filing",
    timestamp: "8 hours ago",
    source: "FCC ECFS",
  },
];

const dataSourceStatus = [
  { name: "Contracts", status: "green" as const, count: "2,341" },
  { name: "FCC", status: "green" as const, count: "8,847" },
  { name: "SEC", status: "yellow" as const, count: "1,203" },
  { name: "Patents", status: "green" as const, count: "4,512" },
  { name: "News", status: "green" as const, count: "12,891" },
  { name: "Orbital", status: "green" as const, count: "45,230" },
];

const suggestedQueries = [
  "What's the latest on NSSL Phase 3 competition?",
  "Show me SpaceX's recent FCC filings",
  "Summarize defense budget impacts on satellite programs",
];

const impactColors = {
  high: "text-red-600 bg-red-50",
  medium: "text-amber-600 bg-amber-50",
  low: "text-slate-500 bg-slate-100",
};

export default function DashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [briefingItems, setBriefingItems] = useState<BriefingItem[]>(sampleBriefingItems);
  const [isSampleData, setIsSampleData] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchBriefing = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/briefing");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data?.items?.length > 0) {
        const items = json.data.items.map((item: BriefingItem, idx: number) => ({
          ...item,
          entities: item.entities.map((e: BriefingEntity, eIdx: number) => ({
            ...e,
            id: e.id || `e-${idx}-${eIdx}`,
          })),
          sources: item.sources.map((s: BriefingSource, sIdx: number) => ({
            ...s,
            id: s.id || `s-${idx}-${sIdx}`,
          })),
        }));
        setBriefingItems(items);
        setIsSampleData(false);
        setGeneratedAt(json.data.generated_at || null);
      }
    } catch {
      // Keep sample data on error
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/v1/agents/meridian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        // Wait a moment then fetch the new briefing
        await new Promise((r) => setTimeout(r, 1000));
        await fetchBriefing();
      }
    } catch {
      // Silently fail
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAsk = () => {
    if (query.trim()) {
      router.push(`/dashboard/ask-raptor?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Daily Intelligence Briefing - Hero Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                Daily Intelligence Briefing
              </h1>
              {isSampleData && (
                <Badge variant="default" className="text-[10px] uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Sample Data
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {today} &middot; Generated by MERIDIAN at 6:00 AM CT
              {generatedAt && !isSampleData && (
                <span className="ml-2 text-slate-400">
                  &middot; Last generated: {new Date(generatedAt).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand-cyan transition-colors disabled:opacity-50"
              title="Refresh Briefing (Admin)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Generating..." : "Refresh"}
            </button>
            <button
              onClick={() => router.push("/dashboard/orbital-brief")}
              className="flex items-center gap-2 text-sm font-medium text-brand-cyan hover:text-brand-cyan-dark transition-colors"
            >
              View Full Brief
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {briefingItems.map((item, idx) => (
            <Card key={idx} variant={item.impact === "high" ? "highlighted" : "default"}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${impactColors[item.impact]}`}
                  >
                    {item.impact === "high" ? (
                      <Zap className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-slate-900">
                      {item.headline}
                    </h3>
                    <Badge variant={item.impact}>
                      {item.impact.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-3">
                    {item.synthesis}
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.entities.map((entity) => (
                        <EntityTag key={entity.id || entity.slug} name={entity.name} slug={entity.slug} type={entity.type} />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.sources.map((source, sIdx) => (
                        <Citation
                          key={source.id}
                          number={sIdx + 1}
                          title={source.title}
                          source={source.type}
                          url={source.url}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Watchlist Alerts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-brand-cyan" />
            Watchlist Alerts
          </h2>
          <button className="text-sm text-brand-cyan hover:text-brand-cyan-dark font-medium">
            Manage Watchlist
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {watchlistAlerts.map((alert, idx) => (
            <Card key={idx}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {alert.entity}
                  </p>
                  <p className="text-xs text-brand-cyan font-medium mt-0.5">
                    {alert.alertType}
                  </p>
                </div>
                <Badge variant="default">{alert.source}</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {alert.timestamp}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* System Status Bar */}
      <section>
        <Card className="!p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                System Status
              </span>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              {dataSourceStatus.map((source) => (
                <div key={source.name} className="flex items-center gap-2">
                  <StatusIndicator status={source.status} pulse={false} />
                  <span className="text-xs text-slate-600">
                    {source.name}{" "}
                    <span className="text-slate-400">({source.count})</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                74,024 documents
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                2,847 entities
              </span>
            </div>
          </div>
        </Card>
      </section>

      {/* Quick Ask Bar */}
      <section className="sticky bottom-4 z-30">
        <Card className="!p-4 shadow-elevated border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder="Ask Raptor anything..."
                className="w-full px-4 py-2.5 bg-slate-50 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 border border-slate-200"
              />
            </div>
            <button
              onClick={handleAsk}
              className="p-2.5 bg-brand-cyan text-white rounded-lg hover:bg-brand-cyan-dark transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
              Try:
            </span>
            {suggestedQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(q);
                  router.push(`/dashboard/ask-raptor?q=${encodeURIComponent(q)}`);
                }}
                className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md hover:bg-slate-100 hover:text-brand-cyan transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
