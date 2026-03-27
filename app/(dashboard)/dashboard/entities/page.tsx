"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, SearchInput, Button } from "@/components/ui";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  MessageSquare,
  FileText,
  Scale,
  Landmark,
  Satellite,
  Newspaper,
  BookOpen,
  Award,
  Building2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EntityData {
  id: string;
  name: string;
  slug: string;
  type: "company" | "agency" | "program";
  sectors: string[];
  lastActivity: string;
  summary: string;
  fullSummary: string;
  sourceCounts: Record<string, number>;
  trend: "up" | "down" | "stable";
  trendPercent: number;
  watched: boolean;
}

const sampleEntities: EntityData[] = [
  {
    id: "1",
    name: "SpaceX",
    slug: "spacex",
    type: "company",
    sectors: ["Launch", "Satellite", "Defense"],
    lastActivity: "2 hours ago",
    summary: "Leading launch provider with Starlink constellation and defense contracts.",
    fullSummary: "SpaceX continues to dominate the commercial launch market with its Falcon 9 and Falcon Heavy vehicles. The Starlink constellation has surpassed 6,000 operational satellites, making it the largest satellite constellation in history. Recent defense contracts through the NSSL program have solidified SpaceX's position as a critical national security launch provider.\n\nThe company's Starship program represents a potential paradigm shift in heavy-lift capabilities, with implications for both commercial and government missions. SpaceX's aggressive pricing strategy and rapid launch cadence continue to pressure competitors, particularly ULA and Arianespace.",
    sourceCounts: { "FCC Filings": 234, "SEC Filings": 0, "Patents": 89, "Government Contracts": 47, "Orbital Assets": 6142, "News": 1203, "Federal Register": 12, "SBIR/STTR": 3, "SAM.gov": 28 },
    trend: "up",
    trendPercent: 23,
    watched: true,
  },
  {
    id: "2",
    name: "Amazon Kuiper",
    slug: "amazon-kuiper",
    type: "program",
    sectors: ["Satellite", "Telecom"],
    lastActivity: "8 hours ago",
    summary: "Amazon's LEO broadband constellation program with 3,236 authorized satellites.",
    fullSummary: "Project Kuiper is Amazon's initiative to build a constellation of 3,236 low Earth orbit satellites to provide broadband internet access. The FCC granted authorization in 2020, with a requirement to deploy half the constellation by 2026.\n\nAmazon has invested over $10 billion in the program and secured launch contracts with ULA, Arianespace, and Blue Origin. The Gen2 constellation modification recently approved by the FCC expands the planned deployment to 7,774 satellites, directly challenging SpaceX's Starlink dominance.",
    sourceCounts: { "FCC Filings": 156, "SEC Filings": 12, "Patents": 45, "Government Contracts": 3, "Orbital Assets": 2, "News": 567, "Federal Register": 8, "SBIR/STTR": 0, "SAM.gov": 1 },
    trend: "up",
    trendPercent: 45,
    watched: true,
  },
  {
    id: "3",
    name: "L3Harris Technologies",
    slug: "l3harris",
    type: "company",
    sectors: ["Defense", "Space", "Satellite"],
    lastActivity: "1 day ago",
    summary: "Major defense contractor focused on space-based ISR and satellite systems.",
    fullSummary: "L3Harris Technologies is a leading defense and technology company with significant operations in space-based intelligence, surveillance, and reconnaissance (ISR) systems. The company is a prime contractor for multiple national security space programs.\n\nRecent patent filings indicate advancement in autonomous satellite servicing capabilities, positioning L3Harris as a competitor in the growing on-orbit servicing market. The company's acquisition strategy has focused on building integrated space and airborne ISR capabilities.",
    sourceCounts: { "FCC Filings": 23, "SEC Filings": 34, "Patents": 178, "Government Contracts": 312, "Orbital Assets": 15, "News": 445, "Federal Register": 7, "SBIR/STTR": 12, "SAM.gov": 89 },
    trend: "stable",
    trendPercent: 2,
    watched: false,
  },
  {
    id: "4",
    name: "Rocket Lab",
    slug: "rocket-lab",
    type: "company",
    sectors: ["Launch", "Space", "Satellite"],
    lastActivity: "5 hours ago",
    summary: "Small launch provider expanding into medium-lift with Neutron rocket.",
    fullSummary: "Rocket Lab has established itself as the second most active orbital launch provider globally with its Electron rocket. The company is developing the medium-lift Neutron vehicle, targeting a 2025 first flight.\n\nRocket Lab's strategy extends beyond launch services into spacecraft manufacturing through its Photon satellite bus and space systems acquisitions. The company's vertically integrated approach positions it as an end-to-end space solutions provider, competing across launch, spacecraft, and ground segment markets.",
    sourceCounts: { "FCC Filings": 12, "SEC Filings": 28, "Patents": 34, "Government Contracts": 18, "Orbital Assets": 3, "News": 389, "Federal Register": 2, "SBIR/STTR": 5, "SAM.gov": 11 },
    trend: "up",
    trendPercent: 15,
    watched: false,
  },
  {
    id: "5",
    name: "DARPA",
    slug: "darpa",
    type: "agency",
    sectors: ["Defense", "Space"],
    lastActivity: "3 days ago",
    summary: "Defense research agency driving next-gen space and defense technology programs.",
    fullSummary: "The Defense Advanced Research Projects Agency (DARPA) continues to be a primary driver of advanced technology development for space and defense applications. Current programs of interest include the Robotic Servicing of Geosynchronous Satellites (RSGS), Blackjack military satellite constellation, and Space-BACN optical inter-satellite link program.\n\nDARPA's investments signal future Department of Defense priorities and often create commercial market opportunities 5-10 years ahead of mainstream adoption. The agency's increasing focus on space domain awareness and resilient architectures reflects growing concerns about space as a contested domain.",
    sourceCounts: { "FCC Filings": 0, "SEC Filings": 0, "Patents": 0, "Government Contracts": 567, "Orbital Assets": 0, "News": 234, "Federal Register": 45, "SBIR/STTR": 234, "SAM.gov": 178 },
    trend: "stable",
    trendPercent: 5,
    watched: true,
  },
  {
    id: "6",
    name: "Northrop Grumman",
    slug: "northrop-grumman",
    type: "company",
    sectors: ["Defense", "Space", "Satellite"],
    lastActivity: "12 hours ago",
    summary: "Prime contractor for national security space and on-orbit servicing pioneer.",
    fullSummary: "Northrop Grumman is a major defense prime contractor with deep expertise in national security space systems. The company pioneered commercial on-orbit satellite servicing with its Mission Extension Vehicle (MEV) technology.\n\nNorthrop Grumman's space portfolio includes the next-generation OPIR missile warning satellites, the Habitation and Logistics Outpost (HALO) for NASA's Gateway station, and the OmegA launch vehicle program. The company's acquisition of Orbital ATK significantly expanded its space capabilities.",
    sourceCounts: { "FCC Filings": 18, "SEC Filings": 42, "Patents": 223, "Government Contracts": 892, "Orbital Assets": 8, "News": 678, "Federal Register": 15, "SBIR/STTR": 45, "SAM.gov": 156 },
    trend: "up",
    trendPercent: 8,
    watched: false,
  },
];

const sourceIcons: Record<string, React.ReactNode> = {
  "FCC Filings": <Scale className="w-3.5 h-3.5" />,
  "SEC Filings": <Landmark className="w-3.5 h-3.5" />,
  "Patents": <Award className="w-3.5 h-3.5" />,
  "Government Contracts": <Building2 className="w-3.5 h-3.5" />,
  "Orbital Assets": <Satellite className="w-3.5 h-3.5" />,
  "News": <Newspaper className="w-3.5 h-3.5" />,
  "Federal Register": <BookOpen className="w-3.5 h-3.5" />,
  "SBIR/STTR": <FileText className="w-3.5 h-3.5" />,
  "SAM.gov": <FileText className="w-3.5 h-3.5" />,
};

const typeBadgeVariant = {
  company: "company" as const,
  agency: "agency" as const,
  program: "program" as const,
};

export default function EntitiesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>("");

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

  const filteredEntities = sampleEntities.filter((entity) => {
    const matchesSearch =
      !search || entity.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || entity.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Entities</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track companies, agencies, and programs across the space & defense sector.
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

      {/* Entity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEntities.map((entity) => {
          const isExpanded = expandedIds.has(entity.id);

          return (
            <div
              key={entity.id}
              className="bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all overflow-hidden"
            >
              {/* Collapsed View (always visible) */}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3
                        className="text-base font-semibold text-slate-900 hover:text-brand-cyan cursor-pointer transition-colors"
                        onClick={() => router.push(`/dashboard/entities/${entity.slug}`)}
                      >
                        {entity.name}
                      </h3>
                      <Badge variant={typeBadgeVariant[entity.type]}>
                        {entity.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {entity.sectors.map((sector) => (
                        <span
                          key={sector}
                          className="text-[10px] text-slate-400 uppercase tracking-wider"
                        >
                          {sector}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">
                      {entity.summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <div className="flex items-center gap-1 text-xs">
                      {entity.trend === "up" ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      ) : entity.trend === "down" ? (
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                      ) : null}
                      <span
                        className={cn(
                          "font-medium",
                          entity.trend === "up"
                            ? "text-emerald-600"
                            : entity.trend === "down"
                            ? "text-red-600"
                            : "text-slate-400"
                        )}
                      >
                        {entity.trendPercent}%
                      </span>
                    </div>
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
                    Last activity: {entity.lastActivity}
                  </span>
                  {entity.watched && (
                    <span className="flex items-center gap-1 text-xs text-brand-cyan">
                      <Eye className="w-3 h-3" /> Watching
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded View */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                  {/* Full Summary */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">
                      Raptor AI Summary
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {entity.fullSummary}
                    </p>
                  </div>

                  {/* Source Links */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">
                      Source Documents
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(entity.sourceCounts).map(
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
                    <Button
                      variant="secondary"
                      size="sm"
                    >
                      {entity.watched ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Remove from Watchlist
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Add to Watchlist
                        </>
                      )}
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
