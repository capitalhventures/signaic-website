"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Card, Badge, Button } from "@/components/ui";
import {
  Newspaper,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Database,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

interface Briefing {
  id: string;
  title: string;
  summary: string;
  content: string;
  briefing_date: string;
  sectors_covered: string[] | null;
  source_count: number;
  key_developments: { title: string; source: string; significance: string }[] | null;
  created_at: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function DailyBriefingsPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [selected, setSelected] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBriefings = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/daily-briefings");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        setBriefings(json.data);
        if (json.data.length > 0 && !selected) {
          setSelected(json.data[0]);
        }
      }
    } catch {
      // Failed to fetch
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    fetchBriefings();
  }, [fetchBriefings]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/v1/daily-briefing/refresh", { method: "POST" });
      if (res.ok) {
        await fetchBriefings();
      }
    } catch {
      // Failed to refresh
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand-cyan animate-spin" />
      </div>
    );
  }

  // Detail view
  if (selected) {
    return (
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(null)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {selected.title || `Daily Intelligence Briefing`}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {formatDate(selected.briefing_date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selected.source_count > 0 && (
              <Badge variant="cyan">
                <Database className="w-3 h-3 mr-1" />
                {selected.source_count} sources
              </Badge>
            )}
          </div>
        </div>

        {/* Sectors */}
        {selected.sectors_covered && selected.sectors_covered.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selected.sectors_covered.map((sector) => (
              <Badge key={sector} variant="default">
                {sector}
              </Badge>
            ))}
          </div>
        )}

        {/* Content */}
        <Card>
          <div className="prose prose-sm prose-slate max-w-none
            prose-headings:text-slate-900
            prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-200
            prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-slate-700 prose-p:leading-relaxed
            prose-li:text-slate-700
            prose-strong:text-slate-900
            prose-ul:my-2
            prose-ol:my-2
          ">
            <ReactMarkdown>{selected.content || selected.summary || "No content available."}</ReactMarkdown>
          </div>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-brand-cyan" />
            Daily Briefings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            AI-generated intelligence briefings synthesized from all monitored data sources.
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          loading={refreshing}
          variant="secondary"
          size="sm"
        >
          {refreshing ? (
            "Generating..."
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Generate Now
            </>
          )}
        </Button>
      </div>

      {/* Briefing List */}
      {briefings.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="w-10 h-10 text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-1">No briefings generated yet</p>
            <p className="text-xs text-slate-400 mb-4">
              Click &quot;Generate Now&quot; to create your first daily intelligence briefing.
            </p>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              loading={refreshing}
              size="sm"
            >
              {refreshing ? "Generating..." : "Generate First Briefing"}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {briefings.map((briefing) => (
            <button
              key={briefing.id}
              onClick={() => setSelected(briefing)}
              className="w-full text-left"
            >
              <Card className="hover:border-brand-cyan/30 hover:shadow-card transition-all group cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {briefing.title || `Briefing - ${briefing.briefing_date}`}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-brand-cyan transition-colors" />
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(briefing.briefing_date)}
                      </span>
                      {briefing.source_count > 0 && (
                        <Badge variant="cyan">
                          {briefing.source_count} sources
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400">
                        {formatRelative(briefing.created_at)}
                      </span>
                    </div>
                    {briefing.summary && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {briefing.summary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Key developments preview */}
                {briefing.key_developments && briefing.key_developments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2">
                      {briefing.key_developments.slice(0, 3).map((dev, i) => (
                        <span
                          key={i}
                          className="text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded"
                        >
                          {dev.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
