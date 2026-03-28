"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, Badge, Button } from "@/components/ui";
import {
  ArrowLeft,
  MessageSquare,
  Scale,
  Landmark,
  Award,
  Building2,
  Satellite,
  Newspaper,
  BookOpen,
  FileText,
  Clock,
  Loader2,
} from "lucide-react";

interface EntityDetail {
  id: string;
  name: string;
  slug: string;
  type: "company" | "agency" | "program";
  sectors: string[];
  description: string;
  last_activity: string | null;
  source_counts: Record<string, number>;
}

const sourceIcons: Record<string, React.ReactNode> = {
  "FCC Filings": <Scale className="w-4 h-4" />,
  "SEC Filings": <Landmark className="w-4 h-4" />,
  Patents: <Award className="w-4 h-4" />,
  "Government Contracts": <Building2 className="w-4 h-4" />,
  "Orbital Assets": <Satellite className="w-4 h-4" />,
  News: <Newspaper className="w-4 h-4" />,
  "Federal Register": <BookOpen className="w-4 h-4" />,
  "SBIR/STTR": <FileText className="w-4 h-4" />,
  "SAM.gov": <FileText className="w-4 h-4" />,
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

export default function EntityDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEntity() {
      try {
        const res = await fetch(`/api/v1/entities/${slug}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data) {
          setEntity(json.data);
        }
      } catch {
        // Failed to fetch
      } finally {
        setIsLoading(false);
      }
    }
    fetchEntity();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 text-brand-cyan animate-spin" />
        <span className="ml-2 text-sm text-slate-400">Loading entity...</span>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => router.push("/dashboard/entities")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Entities
        </button>
        <div className="text-center py-12">
          <p className="text-sm text-slate-400">Entity not found.</p>
        </div>
      </div>
    );
  }

  const sourceCounts = entity.source_counts || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button + Header */}
      <div>
        <button
          onClick={() => router.push("/dashboard/entities")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Entities
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">
                {entity.name}
              </h1>
              <Badge variant={entity.type}>{entity.type}</Badge>
            </div>
            <div className="flex items-center gap-3">
              {entity.sectors?.map((sector) => (
                <Badge key={sector} variant="default">
                  {sector}
                </Badge>
              ))}
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last activity: {formatRelativeTime(entity.last_activity)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                router.push(
                  `/dashboard/ask-raptor?q=${encodeURIComponent(`Tell me about ${entity.name}`)}`
                )
              }
            >
              <MessageSquare className="w-4 h-4" />
              Ask Raptor
            </Button>
          </div>
        </div>
      </div>

      {/* Description */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Overview
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {entity.description}
        </p>
      </Card>

      {/* Source Documents */}
      {Object.keys(sourceCounts).length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Source Documents
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(sourceCounts).map(([source, count]) => (
              <button
                key={source}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-brand-cyan/30 hover:shadow-card transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-brand-cyan/10 flex items-center justify-center text-slate-400 group-hover:text-brand-cyan transition-colors">
                  {sourceIcons[source]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {source}
                  </p>
                  <p className="text-lg font-bold text-slate-900 font-mono">
                    {(count as number).toLocaleString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
