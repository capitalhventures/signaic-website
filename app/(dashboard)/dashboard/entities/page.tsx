"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge, SearchInput, Button } from "@/components/ui";
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText,
  Scale,
  Landmark,
  Satellite,
  Newspaper,
  BookOpen,
  Award,
  Building2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EntityData {
  id: string;
  name: string;
  slug: string;
  type: "company" | "agency" | "program";
  sectors: string[];
  last_activity: string | null;
  description: string;
  source_counts: Record<string, number>;
}

const sourceIcons: Record<string, React.ReactNode> = {
  "FCC Filings": <Scale className="w-3.5 h-3.5" />,
  "SEC Filings": <Landmark className="w-3.5 h-3.5" />,
  Patents: <Award className="w-3.5 h-3.5" />,
  "Government Contracts": <Building2 className="w-3.5 h-3.5" />,
  "Orbital Assets": <Satellite className="w-3.5 h-3.5" />,
  News: <Newspaper className="w-3.5 h-3.5" />,
  "Federal Register": <BookOpen className="w-3.5 h-3.5" />,
  "SBIR/STTR": <FileText className="w-3.5 h-3.5" />,
  "SAM.gov": <FileText className="w-3.5 h-3.5" />,
};

const typeBadgeVariant = {
  company: "company" as const,
  agency: "agency" as const,
  program: "program" as const,
};

function formatRelativeTime(dateStr: string | null) {
  if (!dateStr) return "No activity";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function EntitiesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [entities, setEntities] = useState<EntityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEntities() {
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (search) params.set("search", search);
        if (typeFilter) params.set("type", typeFilter);

        const res = await fetch(`/api/v1/entities?${params}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data?.entities) {
          setEntities(json.data.entities);
        }
      } catch {
        // Failed to fetch
      } finally {
        setIsLoading(false);
      }
    }
    fetchEntities();
  }, [search, typeFilter]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Entities</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track companies, agencies, and programs across the space & defense
          sector.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search entities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["", "company", "agency", "program"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium border transition-colors",
                typeFilter === type
                  ? "bg-brand-cyan text-white border-brand-cyan"
                  : "bg-white text-slate-600 border-slate-300 hover:border-brand-cyan/50"
              )}
            >
              {type || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-brand-cyan animate-spin" />
          <span className="ml-2 text-sm text-slate-400">
            Loading entities...
          </span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && entities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-slate-400">
            {search || typeFilter
              ? "No entities match your filters."
              : "No entities tracked yet."}
          </p>
        </div>
      )}

      {/* Entity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {entities.map((entity) => {
          const isExpanded = expandedIds.has(entity.id);

          return (
            <div
              key={entity.id}
              className="bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all overflow-hidden"
            >
              {/* Collapsed View */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3
                        className="text-base font-semibold text-slate-900 hover:text-brand-cyan cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(`/dashboard/entities/${entity.slug}`)
                        }
                      >
                        {entity.name}
                      </h3>
                      <Badge variant={typeBadgeVariant[entity.type]}>
                        {entity.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {entity.sectors?.map((sector) => (
                        <span
                          key={sector}
                          className="text-[10px] text-slate-400 uppercase tracking-wider"
                        >
                          {sector}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">
                      {entity.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => toggleExpand(entity.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-slate-400">
                    Last activity:{" "}
                    {formatRelativeTime(entity.last_activity)}
                  </span>
                </div>
              </div>

              {/* Expanded View */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {entity.description}
                    </p>
                  </div>

                  {/* Source Counts */}
                  {entity.source_counts &&
                    Object.keys(entity.source_counts).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">
                          Source Documents
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Object.entries(entity.source_counts).map(
                            ([source, count]) =>
                              count > 0 && (
                                <button
                                  key={source}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors text-left"
                                >
                                  <span className="text-slate-400">
                                    {sourceIcons[source]}
                                  </span>
                                  <span className="truncate">{source}</span>
                                  <span className="ml-auto font-mono text-slate-400 flex-shrink-0">
                                    {count}
                                  </span>
                                </button>
                              )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/dashboard/ask-raptor?q=${encodeURIComponent(`Tell me about ${entity.name}`)}`
                        )
                      }
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Ask Raptor about {entity.name}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
