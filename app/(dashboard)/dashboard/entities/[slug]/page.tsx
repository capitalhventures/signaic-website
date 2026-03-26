"use client";

import { useRouter } from "next/navigation";
import { Card, Badge, Button } from "@/components/ui";
import {
  ArrowLeft,
  MessageSquare,
  Eye,
  Scale,
  Landmark,
  Award,
  Building2,
  Satellite,
  Newspaper,
  BookOpen,
  FileText,
  TrendingUp,
  Clock,
  ExternalLink,
} from "lucide-react";

// In production, this would fetch from the API based on slug
const entityData = {
  id: "1",
  name: "SpaceX",
  slug: "spacex",
  type: "company" as const,
  sectors: ["Launch", "Satellite", "Defense"],
  lastActivity: "2 hours ago",
  fullSummary:
    "SpaceX continues to dominate the commercial launch market with its Falcon 9 and Falcon Heavy vehicles. The Starlink constellation has surpassed 6,000 operational satellites, making it the largest satellite constellation in history. Recent defense contracts through the NSSL program have solidified SpaceX's position as a critical national security launch provider.\n\nThe company's Starship program represents a potential paradigm shift in heavy-lift capabilities, with implications for both commercial and government missions. SpaceX's aggressive pricing strategy and rapid launch cadence continue to pressure competitors, particularly ULA and Arianespace.\n\nKey strategic considerations include the company's vertically integrated manufacturing approach, reusability economics, and growing influence in both commercial and national security space markets.",
  competitiveContext:
    "SpaceX's primary competitors include United Launch Alliance (ULA) for national security launches, Arianespace for commercial GEO launches, and Rocket Lab for small satellite launches. In the broadband constellation space, SpaceX's Starlink faces competition from Amazon's Project Kuiper, OneWeb, and Telesat. SpaceX maintains significant cost advantages through launch vehicle reusability and vertical integration.",
  sourceCounts: {
    "FCC Filings": 234,
    "SEC Filings": 0,
    Patents: 89,
    "Government Contracts": 47,
    "Orbital Assets": 6142,
    News: 1203,
    "Federal Register": 12,
    "SBIR/STTR": 3,
    "SAM.gov": 28,
  },
  keyDocuments: [
    { title: "NRO Launch Contract Extension FA8811-24-R-0001", source: "SAM.gov", date: "Mar 25, 2026" },
    { title: "Starlink Gen2 FCC Modification DA-24-1820", source: "FCC", date: "Mar 22, 2026" },
    { title: "NSSL Phase 3 Lane 1 Award Notice", source: "Contracts", date: "Mar 18, 2026" },
    { title: "Starship Launch License Modification", source: "Federal Register", date: "Mar 15, 2026" },
    { title: "Patent: Reusable Heat Shield System", source: "USPTO", date: "Mar 10, 2026" },
  ],
  timeline: [
    { date: "Mar 25, 2026", event: "NRO contract extension announced ($1.8B)", type: "contract" },
    { date: "Mar 22, 2026", event: "Starlink Gen2 modification approved by FCC", type: "regulatory" },
    { date: "Mar 20, 2026", event: "Falcon 9 launch: Starlink Group 12-4", type: "launch" },
    { date: "Mar 18, 2026", event: "NSSL Phase 3 Lane 1 contract awarded", type: "contract" },
    { date: "Mar 15, 2026", event: "Starship launch license updated", type: "regulatory" },
    { date: "Mar 12, 2026", event: "New patent filing: heat shield technology", type: "patent" },
  ],
};

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

const eventTypeColors: Record<string, string> = {
  contract: "bg-teal-500",
  regulatory: "bg-violet-500",
  launch: "bg-brand-cyan",
  patent: "bg-orange-500",
};

export default function EntityDetailPage() {
  const router = useRouter();
  const entity = entityData;

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
              {entity.sectors.map((sector) => (
                <Badge key={sector} variant="default">
                  {sector}
                </Badge>
              ))}
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last activity: {entity.lastActivity}
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
            <Button variant="secondary">
              <Eye className="w-4 h-4" />
              Add to Watchlist
            </Button>
          </div>
        </div>
      </div>

      {/* Raptor Summary */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">
          Raptor AI Summary
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {entity.fullSummary}
        </p>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* Source Documents */}
        <div className="col-span-2 space-y-4">
          <Card>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Source Documents
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(entity.sourceCounts).map(([source, count]) => (
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
                      {count.toLocaleString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Competitive Context */}
          <Card>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Competitive Context
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {entity.competitiveContext}
            </p>
          </Card>

          {/* Key Documents */}
          <Card>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Key Documents
            </h2>
            <div className="space-y-2">
              {entity.keyDocuments.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate group-hover:text-brand-cyan transition-colors">
                        {doc.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {doc.source} &middot; {doc.date}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-brand-cyan transition-colors flex-shrink-0" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Activity Timeline */}
        <div>
          <Card>
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-cyan" />
              Activity Timeline
            </h2>
            <div className="space-y-4">
              {entity.timeline.map((event, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${eventTypeColors[event.type] || "bg-slate-300"}`}
                    />
                    {idx < entity.timeline.length - 1 && (
                      <div className="w-px flex-1 bg-slate-200 mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-xs text-slate-400">{event.date}</p>
                    <p className="text-sm text-slate-700 mt-0.5">
                      {event.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
