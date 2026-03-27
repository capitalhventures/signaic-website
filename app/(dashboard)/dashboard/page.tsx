"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  BarChart3,
  Activity,
  Globe,
  Shield,
  Satellite,
  FileSearch,
  Newspaper,
  Scale,
} from "lucide-react";

/* ─── Types ─── */
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

/* ─── Sample Briefing Data ─── */
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

/* ─── Watchlist Alerts ─── */
const watchlistAlerts = [
  { entity: "SpaceX", alertType: "New Contract", timestamp: "2 hours ago", source: "SAM.gov" },
  { entity: "Rocket Lab", alertType: "SEC Filing", timestamp: "5 hours ago", source: "SEC EDGAR" },
  { entity: "Amazon Kuiper", alertType: "FCC Filing", timestamp: "8 hours ago", source: "FCC ECFS" },
];

/* ─── Data Source Cards ─── */
const dataSourceCards = [
  { name: "Government Contracts", icon: Shield, status: "green" as const, records: "2,341", lastRefresh: "12 min ago", source: "SAM.gov" },
  { name: "FCC Filings", icon: Globe, status: "green" as const, records: "8,847", lastRefresh: "28 min ago", source: "FCC ICFS / ECFS" },
  { name: "SEC EDGAR", icon: FileSearch, status: "yellow" as const, records: "1,203", lastRefresh: "3 hrs ago", source: "SEC EDGAR" },
  { name: "Patents", icon: FileText, status: "green" as const, records: "4,512", lastRefresh: "1 hr ago", source: "USPTO" },
  { name: "News & RSS", icon: Newspaper, status: "green" as const, records: "12,891", lastRefresh: "5 min ago", source: "Industry RSS" },
  { name: "Orbital Data", icon: Satellite, status: "green" as const, records: "45,230", lastRefresh: "18 min ago", source: "Space-Track / CelesTrak" },
];

/* ─── Recent Activity ─── */
const recentActivity = [
  { type: "contract", title: "USSF awards $340M SATCOM contract to L3Harris", time: "35 min ago", source: "SAM.gov" },
  { type: "fcc", title: "Telesat files LEO constellation amendment for Lightspeed", time: "1 hr ago", source: "FCC ICFS" },
  { type: "patent", title: "Blue Origin patents reusable upper stage heatshield", time: "2 hrs ago", source: "USPTO" },
  { type: "sec", title: "Rocket Lab 10-Q filing reveals $42M backlog increase", time: "3 hrs ago", source: "SEC EDGAR" },
  { type: "news", title: "ESA selects Arianespace for Galileo second-gen launches", time: "4 hrs ago", source: "SpaceNews" },
  { type: "orbital", title: "34 new objects cataloged from Starlink Group 12-6 launch", time: "5 hrs ago", source: "Space-Track" },
  { type: "contract", title: "DARPA RSGS Phase 3 sources sought notice published", time: "6 hrs ago", source: "SAM.gov" },
  { type: "fcc", title: "OneWeb files spectrum coordination request with ITU", time: "8 hrs ago", source: "ITU" },
];

/* ─── Intelligence Activity (bar chart data — last 7 days) ─── */
const activityByDay = [
  { day: "Mon", contracts: 12, fcc: 8, patents: 5, sec: 3, news: 24, orbital: 18 },
  { day: "Tue", contracts: 8, fcc: 14, patents: 7, sec: 6, news: 31, orbital: 12 },
  { day: "Wed", contracts: 15, fcc: 6, patents: 3, sec: 4, news: 28, orbital: 22 },
  { day: "Thu", contracts: 10, fcc: 11, patents: 9, sec: 2, news: 19, orbital: 15 },
  { day: "Fri", contracts: 18, fcc: 9, patents: 4, sec: 8, news: 35, orbital: 20 },
  { day: "Sat", contracts: 3, fcc: 2, patents: 1, sec: 0, news: 12, orbital: 8 },
  { day: "Sun", contracts: 2, fcc: 1, patents: 0, sec: 0, news: 8, orbital: 5 },
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

const activityTypeIcons: Record<string, string> = {
  contract: "text-emerald-500",
  fcc: "text-blue-500",
  patent: "text-violet-500",
  sec: "text-amber-500",
  news: "text-slate-500",
  orbital: "text-cyan-500",
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

  // Calculate max value for chart scaling
  const chartMax = Math.max(...activityByDay.map((d) => d.contracts + d.fcc + d.patents + d.sec + d.news + d.orbital));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Command Center</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-brand-cyan transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Generating..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ═══ QUICK STATS ROW ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
              <Database className="w-5 h-5 text-brand-cyan" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">74,024</p>
              <p className="text-xs text-slate-500">Total Records</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">12</p>
              <p className="text-xs text-slate-500">Sources Active</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">2,847</p>
              <p className="text-xs text-slate-500">Entities Tracked</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">5 min</p>
              <p className="text-xs text-slate-500">Last Refresh</p>
            </div>
          </div>
        </Card>
      </div>

      {/* ═══ INTELLIGENCE ACTIVITY + RECENT ACTIVITY ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Activity Chart (3 cols) */}
        <Card className="lg:col-span-3 !p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-cyan" />
              Intelligence Activity — Last 7 Days
            </h2>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400" />Contracts</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-400" />FCC</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-violet-400" />Patents</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400" />SEC</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-400" />News</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyan-400" />Orbital</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-40">
            {activityByDay.map((day) => {
              const total = day.contracts + day.fcc + day.patents + day.sec + day.news + day.orbital;
              const scale = (val: number) => (val / chartMax) * 100;
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col-reverse" style={{ height: `${scale(total)}%`, minHeight: 4 }}>
                    <div className="bg-emerald-400 rounded-t-sm" style={{ height: `${(day.contracts / total) * 100}%` }} />
                    <div className="bg-blue-400" style={{ height: `${(day.fcc / total) * 100}%` }} />
                    <div className="bg-violet-400" style={{ height: `${(day.patents / total) * 100}%` }} />
                    <div className="bg-amber-400" style={{ height: `${(day.sec / total) * 100}%` }} />
                    <div className="bg-slate-300" style={{ height: `${(day.news / total) * 100}%` }} />
                    <div className="bg-cyan-400 rounded-b-sm" style={{ height: `${(day.orbital / total) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{day.day}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Activity Feed (2 cols) */}
        <Card className="lg:col-span-2 !p-5">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-brand-cyan" />
            Recent Activity
          </h2>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {recentActivity.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${activityTypeIcons[item.type]?.replace("text-", "bg-")}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 leading-snug">{item.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.source} &middot; {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ═══ DATA SOURCE CARDS ═══ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-brand-cyan" />
            Data Sources
          </h2>
          <Link href="/dashboard/data-sources" className="text-xs text-brand-cyan hover:text-brand-cyan-dark font-medium flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {dataSourceCards.map((ds) => (
            <Card key={ds.name} className="!p-3">
              <div className="flex items-center gap-2 mb-2">
                <StatusIndicator status={ds.status} pulse={ds.status === "yellow"} />
                <ds.icon className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-xs font-semibold text-slate-900 mb-0.5">{ds.name}</p>
              <p className="text-lg font-bold text-slate-900">{ds.records}</p>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {ds.lastRefresh}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══ DAILY INTELLIGENCE BRIEFING ═══ */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-cyan" />
                Daily Intelligence Briefing
              </h2>
              {isSampleData && (
                <Badge variant="default" className="text-[10px] uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Sample Data
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Last updated: 6:00 AM CT
              {generatedAt && !isSampleData && (
                <span className="ml-1">
                  &middot; {new Date(generatedAt).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <Link
            href="/dashboard/orbital-brief"
            className="flex items-center gap-2 text-xs font-medium text-brand-cyan hover:text-brand-cyan-dark transition-colors"
          >
            View Full Brief <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {briefingItems.map((item, idx) => (
            <Card key={idx} variant={item.impact === "high" ? "highlighted" : "default"}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${impactColors[item.impact]}`}>
                    {item.impact === "high" ? <Zap className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-slate-900">{item.headline}</h3>
                    <Badge variant={item.impact}>{item.impact.toUpperCase()}</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">{item.synthesis}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      {item.entities.map((entity) => (
                        <EntityTag key={entity.id || entity.slug} name={entity.name} slug={entity.slug} type={entity.type} />
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      {item.sources.map((source, sIdx) => (
                        <Citation key={source.id} number={sIdx + 1} title={source.title} source={source.type} url={source.url} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══ WATCHLIST ALERTS ═══ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-cyan" />
            Watchlist Alerts
          </h2>
          <Link href="/dashboard/entities" className="text-xs text-brand-cyan hover:text-brand-cyan-dark font-medium flex items-center gap-1">
            Manage Watchlist <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {watchlistAlerts.map((alert, idx) => (
            <Card key={idx} className="!p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{alert.entity}</p>
                  <p className="text-xs text-brand-cyan font-medium mt-0.5">{alert.alertType}</p>
                </div>
                <Badge variant="default">{alert.source}</Badge>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {alert.timestamp}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══ SYSTEM STATUS BAR ═══ */}
      <Card className="!p-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">System</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {dataSourceCards.map((source) => (
              <div key={source.name} className="flex items-center gap-1.5">
                <StatusIndicator status={source.status} pulse={false} />
                <span className="text-[10px] text-slate-600">{source.name}</span>
              </div>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3 text-[10px] text-slate-400">
            <span>74,024 docs</span>
            <span>2,847 entities</span>
          </div>
        </div>
      </Card>

      {/* ═══ QUICK ASK BAR ═══ */}
      <section className="sticky bottom-4 z-30">
        <Card className="!p-4 shadow-elevated border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex-1">
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
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Try:</span>
            {suggestedQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(q);
                  router.push(`/dashboard/ask-raptor?q=${encodeURIComponent(q)}`);
                }}
                className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded hover:bg-slate-100 hover:text-brand-cyan transition-colors"
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
