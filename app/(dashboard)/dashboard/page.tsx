"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  BarChart3,
  Bookmark,
  Clock,
  Eye,
  EyeOff,
  GripVertical,
  RefreshCw,
  Send,
  Settings,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface DashboardStats {
  sourcesActive: number;
  totalSources: number;
  lastRefreshMinutes: number | null;
  lastRefreshAt: string | null;
  newAlerts: number;
  watchlistUpdates: number;
}

interface WeeklyActivity {
  week: string;
  fcc_filings: number;
  patents: number;
  contracts: number;
  news: number;
  sec_filings: number;
  federal_register: number;
}

interface SectorCount {
  sector: string;
  count: number;
}

interface TopEntity {
  name: string;
  slug: string;
  type: string;
  activity_count: number;
}

interface ChartData {
  weeklyActivity: WeeklyActivity[];
  sectorDistribution: SectorCount[];
  topEntities: TopEntity[];
  alertSeverity: Record<string, number>;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  source: string;
  created_at: string;
  url?: string;
}

interface AlertItem {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  source_type: string | null;
  source_url: string | null;
  read: boolean;
  created_at: string;
  entity_id: string | null;
  entities: { id: string; name: string; slug: string; type: string } | null;
}

interface SectionConfig {
  key: string;
  label: string;
  visible: boolean;
  position: number;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const CYAN_PALETTE = [
  "#06b6d4", // cyan-500
  "#0891b2", // cyan-600
  "#22d3ee", // cyan-400
  "#0e7490", // cyan-700
  "#67e8f9", // cyan-300
  "#155e75", // cyan-800
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#06b6d4",
};

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  fcc: "#3b82f6",
  contract: "#10b981",
  patent: "#8b5cf6",
  sec: "#f59e0b",
  news: "#64748b",
  federal_register: "#ec4899",
};

const DEFAULT_SECTIONS: SectionConfig[] = [
  { key: "stats", label: "Key Metrics", visible: true, position: 0 },
  { key: "activity-feed", label: "Recent Activity", visible: true, position: 1 },
  { key: "alerts", label: "Active Alerts", visible: true, position: 2 },
  { key: "weekly-activity", label: "Filing & Activity Trend (90 Days)", visible: true, position: 3 },
  { key: "sector-distribution", label: "Sector Distribution", visible: true, position: 4 },
  { key: "top-entities", label: "Top Entities by Activity", visible: true, position: 5 },
];

/* ═══════════════════════════════════════════════════════════════
   SORTABLE SECTION WRAPPER
   ═══════════════════════════════════════════════════════════════ */

function SortableSection({
  id,
  children,
  isCustomizing,
}: {
  id: string;
  children: React.ReactNode;
  isCustomizing: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !isCustomizing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {isCustomizing && (
        <button
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded bg-slate-200 hover:bg-cyan-100 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-slate-400" />
        </button>
      )}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CUSTOMIZE PANEL
   ═══════════════════════════════════════════════════════════════ */

function CustomizePanel({
  sections,
  onToggle,
  onReset,
  onClose,
}: {
  sections: SectionConfig[];
  onToggle: (key: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 z-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Dashboard Sections</h3>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Done
        </button>
      </div>
      <div className="space-y-2">
        {sections
          .filter((s) => s.key !== "stats")
          .map((section) => (
            <button
              key={section.key}
              onClick={() => onToggle(section.key)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm text-slate-700">{section.label}</span>
              {section.visible ? (
                <Eye className="w-4 h-4 text-cyan-500" />
              ) : (
                <EyeOff className="w-4 h-4 text-slate-300" />
              )}
            </button>
          ))}
      </div>
      <button
        onClick={onReset}
        className="mt-3 w-full text-xs text-slate-400 hover:text-slate-600 py-1.5"
      >
        Reset to Default
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const router = useRouter();

  // Data state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Customize state
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);

  // Quick Ask
  const [query, setQuery] = useState("");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /* ─── Data Fetching ─── */

  const fetchAllData = useCallback(async () => {
    try {
      const [statsRes, chartsRes, activityRes, alertsRes, prefsRes] = await Promise.all([
        fetch("/api/v1/dashboard/stats"),
        fetch("/api/v1/dashboard/charts"),
        fetch("/api/v1/dashboard/activity"),
        fetch("/api/v1/dashboard/alerts"),
        fetch("/api/v1/dashboard/preferences"),
      ]);

      if (statsRes.ok) {
        const json = await statsRes.json();
        if (json.success) setStats(json.data);
      }

      if (chartsRes.ok) {
        const json = await chartsRes.json();
        if (json.success) setChartData(json.data);
      }

      if (activityRes.ok) {
        const json = await activityRes.json();
        if (json.success) setActivities(json.data);
      }

      if (alertsRes.ok) {
        const json = await alertsRes.json();
        if (json.success) setAlerts(json.data);
      }

      if (prefsRes.ok) {
        const json = await prefsRes.json();
        if (json.success && json.data?.length > 0) {
          const savedSections = DEFAULT_SECTIONS.map((def) => {
            const saved = json.data.find(
              (p: { section_key: string }) => p.section_key === def.key
            );
            return saved
              ? { ...def, visible: saved.visible, position: saved.position }
              : def;
          });
          savedSections.sort((a: SectionConfig, b: SectionConfig) => a.position - b.position);
          setSections(savedSections);
        }
      }
    } catch {
      // Network error — leave defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  /* ─── Handlers ─── */

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setIsRefreshing(false);
  };

  const handleAsk = () => {
    if (query.trim()) {
      router.push(`/dashboard/ask-raptor?q=${encodeURIComponent(query)}`);
    }
  };

  const handleToggleSection = (key: string) => {
    setSections((prev) => {
      const updated = prev.map((s) =>
        s.key === key ? { ...s, visible: !s.visible } : s
      );
      savePreferences(updated);
      return updated;
    });
  };

  const handleResetSections = () => {
    setSections(DEFAULT_SECTIONS);
    savePreferences(DEFAULT_SECTIONS);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.key === active.id);
      const newIndex = prev.findIndex((s) => s.key === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex).map((s, i) => ({
        ...s,
        position: i,
      }));
      savePreferences(reordered);
      return reordered;
    });
  };

  const savePreferences = async (secs: SectionConfig[]) => {
    try {
      await fetch("/api/v1/dashboard/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: secs.map((s) => ({
            key: s.key,
            visible: s.visible,
            position: s.position,
          })),
        }),
      });
    } catch {
      // Silently fail — preferences are not critical
    }
  };

  /* ─── Derived Data ─── */

  const lastRefreshLabel = useMemo(() => {
    if (!stats?.lastRefreshMinutes && stats?.lastRefreshMinutes !== 0) return "N/A";
    const mins = stats.lastRefreshMinutes;
    if (mins < 60) return `${mins} min`;
    if (mins < 1440) return `${Math.round(mins / 60)} hr`;
    return `${Math.round(mins / 1440)} days`;
  }, [stats]);

  const formattedWeeklyData = useMemo(() => {
    if (!chartData?.weeklyActivity) return [];
    return chartData.weeklyActivity.map((w) => ({
      ...w,
      label: new Date(w.week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
  }, [chartData]);

  const isVisible = (key: string) => sections.find((s) => s.key === key)?.visible ?? true;

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  /* ─── Section Renderers ─── */

  const renderStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button onClick={() => router.push("/dashboard/data-sources")} className="text-left">
        <Card className="!p-4 hover:border-cyan-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats ? stats.sourcesActive : <span className="animate-pulse text-slate-300">--</span>}
              </p>
              <p className="text-xs text-slate-500">Sources Active</p>
            </div>
          </div>
        </Card>
      </button>

      <button onClick={() => router.push("/dashboard/data-sources")} className="text-left">
        <Card className="!p-4 hover:border-cyan-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand-cyan" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats ? lastRefreshLabel : <span className="animate-pulse text-slate-300">--</span>}
              </p>
              <p className="text-xs text-slate-500">Last Refresh</p>
            </div>
          </div>
        </Card>
      </button>

      <button onClick={() => router.push("/dashboard/entities")} className="text-left">
        <Card className="!p-4 hover:border-cyan-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats ? stats.newAlerts : <span className="animate-pulse text-slate-300">--</span>}
              </p>
              <p className="text-xs text-slate-500">New Alerts</p>
            </div>
          </div>
        </Card>
      </button>

      <button onClick={() => router.push("/dashboard/entities")} className="text-left">
        <Card className="!p-4 hover:border-cyan-300 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats ? stats.watchlistUpdates : <span className="animate-pulse text-slate-300">--</span>}
              </p>
              <p className="text-xs text-slate-500">Watchlist Updates</p>
            </div>
          </div>
        </Card>
      </button>
    </div>
  );

  const renderActivityFeed = () => (
    <Card className="!p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-cyan" />
          Recent Activity
        </h2>
        <button
          onClick={() => router.push("/dashboard/data-sources")}
          className="text-xs text-brand-cyan hover:text-cyan-700 font-medium flex items-center gap-1"
        >
          See all <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No recent activity</p>
        ) : (
          activities.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.url) {
                  window.open(item.url, "_blank");
                } else {
                  router.push("/dashboard/data-sources");
                }
              }}
              className="flex items-start gap-3 w-full text-left hover:bg-slate-50 rounded-lg p-1.5 -m-1.5 transition-colors"
            >
              <div
                className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: ACTIVITY_TYPE_COLORS[item.type] || "#94a3b8" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 leading-snug truncate">{item.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {item.source} &middot; {formatRelativeTime(item.created_at)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  );

  const renderAlerts = () => (
    <Card className="!p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-brand-cyan" />
          Active Alerts
        </h2>
        <button
          onClick={() => router.push("/dashboard/entities")}
          className="text-xs text-brand-cyan hover:text-cyan-700 font-medium flex items-center gap-1"
        >
          See all <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No active alerts</p>
        ) : (
          alerts.slice(0, 5).map((alert) => (
            <button
              key={alert.id}
              onClick={() => {
                if (alert.entities?.slug) {
                  router.push(`/dashboard/entities/${alert.entities.slug}`);
                } else {
                  router.push("/dashboard/entities");
                }
              }}
              className="flex items-start gap-3 w-full text-left hover:bg-slate-50 rounded-lg p-1.5 -m-1.5 transition-colors"
            >
              <div
                className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                style={{ backgroundColor: SEVERITY_COLORS[alert.severity] || "#94a3b8" }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-slate-900 truncate">{alert.title}</p>
                  <Badge variant={alert.severity === "high" || alert.severity === "critical" ? "high" : alert.severity === "medium" ? "medium" : "low"}>
                    {alert.severity}
                  </Badge>
                </div>
                {alert.entities && (
                  <p className="text-[10px] text-cyan-600 mt-0.5">{alert.entities.name}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {formatRelativeTime(alert.created_at)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  );

  const renderWeeklyActivity = () => (
    <Card className="!p-5">
      <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-brand-cyan" />
        Filing & Activity Trend (90 Days)
      </h2>
      {formattedWeeklyData.length === 0 ? (
        <p className="text-xs text-slate-400 py-8 text-center">No activity data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={formattedWeeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradContracts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradFCC" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0891b2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradNews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPatents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0e7490" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0e7490" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "11px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "10px" }} />
            <Area
              type="monotone"
              dataKey="contracts"
              name="Contracts"
              stroke="#06b6d4"
              fill="url(#gradContracts)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="fcc_filings"
              name="FCC Filings"
              stroke="#0891b2"
              fill="url(#gradFCC)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="news"
              name="News"
              stroke="#22d3ee"
              fill="url(#gradNews)"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="patents"
              name="Patents"
              stroke="#0e7490"
              fill="url(#gradPatents)"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );

  const renderSectorDistribution = () => {
    const data = chartData?.sectorDistribution || [];
    const total = data.reduce((sum, d) => sum + d.count, 0);

    return (
      <Card className="!p-5">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-brand-cyan" />
          Sector Distribution
        </h2>
        {data.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No sector data available</p>
        ) : (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={data.slice(0, 8)}
                  dataKey="count"
                  nameKey="sector"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={2}
                >
                  {data.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={CYAN_PALETTE[i % CYAN_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                  formatter={(value) => [
                    `${value} (${total > 0 ? Math.round((Number(value) / total) * 100) : 0}%)`,
                    "Entities",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {data.slice(0, 8).map((item, i) => (
                <button
                  key={item.sector}
                  onClick={() =>
                    router.push(`/dashboard/entities?sector=${encodeURIComponent(item.sector)}`)
                  }
                  className="flex items-center gap-2 w-full text-left hover:bg-slate-50 rounded px-1 py-0.5 transition-colors"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: CYAN_PALETTE[i % CYAN_PALETTE.length] }}
                  />
                  <span className="text-[11px] text-slate-600 truncate flex-1">{item.sector}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{item.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  };

  const renderTopEntities = () => {
    const data = chartData?.topEntities || [];

    return (
      <Card className="!p-5">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-brand-cyan" />
          Top Entities by Activity
        </h2>
        {data.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No entity data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(value) => [value, "Total Activity"]}
              />
              <Bar
                dataKey="activity_count"
                fill="#06b6d4"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(data) => {
                  const payload = data as unknown as TopEntity;
                  if (payload?.slug) router.push(`/dashboard/entities/${payload.slug}`);
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    );
  };

  /* ─── Section Registry ─── */

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    stats: renderStats,
    "activity-feed": renderActivityFeed,
    alerts: renderAlerts,
    "weekly-activity": renderWeeklyActivity,
    "sector-distribution": renderSectorDistribution,
    "top-entities": renderTopEntities,
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Command Center</h1>
            <p className="text-xs text-slate-400 mt-0.5">{today}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="!p-4">
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100" />
                <div className="space-y-2">
                  <div className="h-6 w-12 bg-slate-100 rounded" />
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="!p-5 h-48 animate-pulse bg-slate-50"><span /></Card>
          <Card className="!p-5 h-48 animate-pulse bg-slate-50"><span /></Card>
        </div>
      </div>
    );
  }

  // Sort visible sections (stats always first)
  const visibleSections = sections.filter((s) => s.visible);

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
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <div className="relative">
            <button
              onClick={() => {
                setShowCustomizePanel(!showCustomizePanel);
                setIsCustomizing(!isCustomizing);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                isCustomizing
                  ? "bg-cyan-500 text-white"
                  : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Customize
            </button>
            {showCustomizePanel && (
              <CustomizePanel
                sections={sections}
                onToggle={handleToggleSection}
                onReset={handleResetSections}
                onClose={() => {
                  setShowCustomizePanel(false);
                  setIsCustomizing(false);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ═══ DASHBOARD SECTIONS (Drag-sortable) ═══ */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleSections.map((s) => s.key)}
          strategy={verticalListSortingStrategy}
        >
          {visibleSections.map((section) => {
            const renderer = sectionRenderers[section.key];
            if (!renderer) return null;

            // Stats row and the two-column row get special layout
            if (section.key === "stats") {
              return (
                <SortableSection key={section.key} id={section.key} isCustomizing={isCustomizing}>
                  {renderer()}
                </SortableSection>
              );
            }

            // Activity feed and alerts sit side-by-side
            if (section.key === "activity-feed") {
              const alertsVisible = isVisible("alerts");
              return (
                <SortableSection key={section.key} id={section.key} isCustomizing={isCustomizing}>
                  <div className={`grid grid-cols-1 ${alertsVisible ? "lg:grid-cols-2" : ""} gap-6`}>
                    {renderer()}
                    {alertsVisible && renderAlerts()}
                  </div>
                </SortableSection>
              );
            }

            // Skip standalone alerts render since it's paired with activity-feed
            if (section.key === "alerts") return null;

            // Visualizations in a responsive grid
            if (section.key === "weekly-activity") {
              const sectorVisible = isVisible("sector-distribution");
              const entitiesVisible = isVisible("top-entities");
              return (
                <SortableSection key={section.key} id={section.key} isCustomizing={isCustomizing}>
                  {renderer()}
                  {(sectorVisible || entitiesVisible) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                      {sectorVisible && renderSectorDistribution()}
                      {entitiesVisible && renderTopEntities()}
                    </div>
                  )}
                </SortableSection>
              );
            }

            // Skip standalone chart sections since they're grouped above
            if (section.key === "sector-distribution" || section.key === "top-entities") {
              return null;
            }

            return (
              <SortableSection key={section.key} id={section.key} isCustomizing={isCustomizing}>
                {renderer()}
              </SortableSection>
            );
          })}
        </SortableContext>
      </DndContext>

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
        </Card>
      </section>
    </div>
  );
}
