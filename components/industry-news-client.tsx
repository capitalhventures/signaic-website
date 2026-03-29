"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Clock, Search, Rss } from "lucide-react";

interface RSSArticle {
  id: string;
  source: string;
  title: string;
  description: string | null;
  url: string;
  author: string | null;
  published_at: string;
  tags: string[] | null;
  created_at: string;
}

const SOURCE_COLORS: Record<string, string> = {
  SpaceNews: "bg-blue-50 text-blue-700 border-blue-200",
  "Via Satellite": "bg-purple-50 text-purple-700 border-purple-200",
  "Defense One": "bg-red-50 text-red-700 border-red-200",
  SpaceFlightNow: "bg-amber-50 text-amber-700 border-amber-200",
  "Space.com": "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const PAGE_SIZE = 30;

export function IndustryNewsClient({
  articles,
  lastRefreshed,
}: {
  articles: RSSArticle[];
  lastRefreshed: string | null;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    articles.forEach((a) => {
      counts.set(a.source, (counts.get(a.source) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [articles]);

  const filtered = useMemo(() => {
    let result = articles;
    if (selectedSource) {
      result = result.filter((a) => a.source === selectedSource);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q)) ||
          (a.author && a.author.toLowerCase().includes(q))
      );
    }
    return result;
  }, [articles, selectedSource, searchQuery]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Rss className="w-6 h-6 text-[#06b6d4]" />
          <h1 className="text-2xl font-bold font-[family-name:var(--font-chakra-petch)] text-[#06b6d4]">
            Industry News
          </h1>
        </div>
        <p className="text-[#666666] text-sm mt-1">
          Aggregated feeds from {sources.length} space & defense industry sources
        </p>
        {lastRefreshed && (
          <div className="flex items-center gap-1 mt-2 text-xs text-[#888888]">
            <Clock className="w-3 h-3" />
            Last updated: {formatDistanceToNow(new Date(lastRefreshed), { addSuffix: true })}
          </div>
        )}
      </div>

      {/* Source filter badges */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedSource(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !selectedSource
              ? "bg-[#06b6d4] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All ({articles.length})
        </button>
        {sources.map((s) => (
          <button
            key={s.name}
            onClick={() => setSelectedSource(selectedSource === s.name ? null : s.name)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedSource === s.name
                ? "bg-[#06b6d4] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s.name} ({s.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4]/20"
        />
      </div>

      {/* Results count */}
      <div className="text-xs text-[#888888]">
        Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} articles
      </div>

      {/* Article list */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <p className="text-[#666666] text-center py-8">
            {searchQuery || selectedSource ? "No matching articles found" : "No articles yet — feeds will populate on the next cron cycle"}
          </p>
        )}
        {visible.map((article) => (
          <Card key={article.id} className="bg-white border-[#f0f0f2] hover:border-[#06b6d4]/20 transition-colors" style={{ borderWidth: "0.5px" }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span
                      onClick={() => window.open(article.url, "_blank")}
                      className="text-sm font-medium text-[#333333] hover:text-[#06b6d4] transition-colors cursor-pointer line-clamp-2 inline-flex items-start gap-1"
                    >
                      {article.title}
                      <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 text-[#999]" />
                    </span>
                  </div>
                  {article.description && (
                    <p className="text-xs text-[#666666] line-clamp-2">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-[#888888] flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${SOURCE_COLORS[article.source] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                    >
                      {article.source}
                    </Badge>
                    <span>
                      {formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                    </span>
                    {article.author && (
                      <>
                        <span>&#183;</span>
                        <span>{article.author}</span>
                      </>
                    )}
                    {article.tags && article.tags.length > 0 && (
                      <>
                        <span>&#183;</span>
                        {article.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[#06b6d4]">#{tag}</span>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load more */}
      {visibleCount < filtered.length && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="border-[#d1d5db] text-[#666666]"
          >
            Load more ({filtered.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
