"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { exportTableToPDF } from "@/lib/export-pdf";

interface NewsArticle {
  id: string;
  title: string | null;
  source: string | null;
  url: string | null;
  published_date: string | null;
  summary: string | null;
  sentiment: string | null;
  category: string | null;
  companies: { id: string; name: string } | null;
}

function sentimentColor(sentiment: string | null) {
  switch (sentiment?.toLowerCase()) {
    case "positive":
      return "bg-green-50 text-green-700 border-green-500/20";
    case "negative":
      return "bg-red-50 text-red-700 border-red-500/20";
    default:
      return "bg-gray-100 text-[#666666] border-gray-500/20";
  }
}

const PAGE_SIZE = 20;

export function NewsClient({ news }: { news: NewsArticle[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = news.slice(0, visibleCount);
  const highlightRef = useRef<HTMLDivElement>(null);

  const uniqueSources = useMemo(() => {
    const sources = new Set<string>();
    news.forEach((a) => {
      if (a.source) sources.add(a.source);
    });
    return Array.from(sources).sort((a, b) => a.localeCompare(b)).slice(0, 20);
  }, [news]);

  function handleExport(articles: NewsArticle[], filterLabel?: string) {
    const columns = ["Title", "Source", "Sentiment", "Published", "Company", "Summary"];
    const rows = articles.map((a) => [
      a.title || "Untitled",
      a.source || "Unknown",
      a.sentiment || "neutral",
      a.published_date
        ? new Date(a.published_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
        : "Unknown",
      a.companies?.name || "—",
      a.summary || "No summary available.",
    ]);
    exportTableToPDF({
      title: "Intelligence Digest",
      subtitle: `${articles.length} article${articles.length !== 1 ? "s" : ""}`,
      columns,
      rows,
      filters: filterLabel,
      filename: `signaic-intelligence-digest-${Date.now()}.pdf`,
    });
  }

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-[family-name:var(--font-chakra-petch)] text-[#00D4FF]">
            News
          </h1>
          <ExportButton
            label="Export PDF"
            options={[
              {
                label: "Export All Articles",
                onClick: () => handleExport(news),
              },
              {
                label: "Export Positive Only",
                onClick: () =>
                  handleExport(
                    news.filter((a) => a.sentiment?.toLowerCase() === "positive"),
                    "Sentiment: Positive"
                  ),
              },
              {
                label: "Export Negative Only",
                onClick: () =>
                  handleExport(
                    news.filter((a) => a.sentiment?.toLowerCase() === "negative"),
                    "Sentiment: Negative"
                  ),
              },
              ...uniqueSources.map((source) => ({
                label: `Source: ${source}`,
                onClick: () =>
                  handleExport(
                    news.filter((a) => a.source === source),
                    `Source: ${source}`
                  ),
              })),
            ]}
          />
        </div>
        <p className="text-[#666666] text-sm mt-1">
          Space & defense industry news
        </p>
        <div className="mt-2 text-xs text-[#888888] bg-[#f8f9fa] border border-[#e2e4e8] rounded-md px-3 py-2 max-w-xl">
          <span className="font-medium text-[#666666]">Sentiment guide:</span>{" "}
          <span className="text-green-700">Positive</span> = favorable industry development,{" "}
          <span className="text-[#666666]">Neutral</span> = factual/informational,{" "}
          <span className="text-red-700">Negative</span> = concerning development or risk signal
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.length === 0 && (
          <p className="text-[#666666] col-span-2 text-center py-8">
            No news articles yet
          </p>
        )}
        {visible.map((article) => (
          <div key={article.id} ref={article.id === highlightId ? highlightRef : undefined}>
            <Card className={`bg-white border-[#f0f0f2] hover:border-[#00D4FF]/10 transition-colors ${article.id === highlightId ? "border-[#00D4FF]/30" : ""}`} style={{ borderWidth: "0.5px" }}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span
                    onClick={() => article.url && window.open(article.url, "_blank")}
                    className="text-sm font-medium text-[#333333] hover:text-[#00D4FF] transition-colors line-clamp-2 cursor-pointer inline-flex items-start gap-1"
                  >
                    {article.title || "Untitled"}
                    {article.url && (
                      <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 text-[#999]" />
                    )}
                  </span>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${sentimentColor(article.sentiment)}`}>
                    {article.sentiment || "neutral"}
                  </Badge>
                </div>
                <p className="text-xs text-[#666666] line-clamp-2">
                  {article.summary || "No summary available."}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                  <span>{article.source || "Unknown"}</span>
                  <span>&#183;</span>
                  <span>
                    {article.published_date
                      ? formatDistanceToNow(new Date(article.published_date), { addSuffix: true })
                      : "Unknown date"}
                  </span>
                  {article.companies && (
                    <>
                      <span>&#183;</span>
                      <span
                        onClick={() => router.push(`/entities/${(article.companies as { id: string }).id}`)}
                        className="text-[#00D4FF] hover:underline cursor-pointer"
                      >
                        {(article.companies as { name: string }).name}
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {visibleCount < news.length && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="border-[#d1d5db] text-[#666666]"
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
