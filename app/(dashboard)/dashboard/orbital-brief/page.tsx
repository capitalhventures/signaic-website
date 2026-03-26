"use client";

import { useState } from "react";
import { Card, Badge, Button, Select } from "@/components/ui";
import {
  FileText,
  Download,
  Clock,
  Loader2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const sectorOptions = [
  { value: "space", label: "Space" },
  { value: "defense", label: "Defense" },
  { value: "telecom", label: "Telecom" },
  { value: "satellite", label: "Satellite" },
  { value: "launch", label: "Launch" },
  { value: "spectrum", label: "Spectrum" },
  { value: "government", label: "Government Contracts" },
];

const depthOptions = [
  { value: "quick", label: "Quick Summary" },
  { value: "standard", label: "Standard Brief" },
  { value: "deep", label: "Deep Dive" },
];

interface RecentBrief {
  id: string;
  title: string;
  depth: string;
  createdAt: string;
}

const sampleRecentBriefs: RecentBrief[] = [
  { id: "1", title: "Standard Brief - Mar 25, 2026", depth: "standard", createdAt: "Yesterday" },
  { id: "2", title: "Deep Dive - Mar 22, 2026", depth: "deep", createdAt: "4 days ago" },
  { id: "3", title: "Quick Summary - Mar 20, 2026", depth: "quick", createdAt: "6 days ago" },
];

export default function OrbitalBriefPage() {
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [depth, setDepth] = useState("standard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [progress, setProgress] = useState("");

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector]
    );
  };

  const generateBrief = async () => {
    setIsGenerating(true);
    setGeneratedContent(null);
    setProgress("Raptor is analyzing documents across multiple sources...");

    try {
      const response = await fetch("/api/v1/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectors: selectedSectors,
          depth,
          dateRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            end: new Date().toISOString().split("T")[0],
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate brief");

      const result = await response.json();
      setGeneratedContent(result.data?.content || "Brief generation complete. Please authenticate to view results.");
    } catch {
      setGeneratedContent("Unable to generate brief. Please ensure you're authenticated and try again.");
    } finally {
      setIsGenerating(false);
      setProgress("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <FileText className="w-6 h-6 text-brand-cyan" />
              The Orbital Brief
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configurable AI-generated intelligence reports for the space &
              defense sector.
            </p>
          </div>

          {/* Configuration Panel */}
          <Card>
            <h2 className="text-base font-semibold text-slate-900 mb-4">
              Configure Your Brief
            </h2>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  defaultValue={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-brand-cyan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-brand-cyan"
                />
              </div>
            </div>

            {/* Sector Focus */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sector Focus
              </label>
              <div className="flex flex-wrap gap-2">
                {sectorOptions.map((sector) => (
                  <button
                    key={sector.value}
                    onClick={() => toggleSector(sector.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedSectors.includes(sector.value)
                        ? "bg-brand-cyan text-white border-brand-cyan"
                        : "bg-white text-slate-600 border-slate-300 hover:border-brand-cyan/50"
                    }`}
                  >
                    {sector.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Report Depth */}
            <div className="mb-6">
              <Select
                label="Report Depth"
                options={depthOptions}
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateBrief}
              disabled={isGenerating}
              loading={isGenerating}
              size="lg"
              className="w-full"
            >
              {isGenerating ? (
                "Generating..."
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Brief
                </>
              )}
            </Button>
          </Card>

          {/* Progress / Generated Report */}
          {isGenerating && (
            <Card variant="highlighted">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-brand-cyan animate-spin" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Generating your brief...
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{progress}</p>
                </div>
              </div>
            </Card>
          )}

          {generatedContent && !isGenerating && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Generated Report
                </h2>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm">
                    <Download className="w-4 h-4" />
                    Export PDF
                  </Button>
                </div>
              </div>
              <div className="prose prose-sm prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                  {generatedContent}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Recent Briefs Sidebar */}
        <div className="w-72 flex-shrink-0">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Recent Briefs
          </h3>
          <div className="space-y-2">
            {sampleRecentBriefs.map((brief) => (
              <button
                key={brief.id}
                className="w-full text-left p-3 rounded-lg border border-slate-200 bg-white hover:border-brand-cyan/30 hover:shadow-card transition-all group"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700 truncate pr-2">
                    {brief.title}
                  </p>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 group-hover:text-brand-cyan transition-colors" />
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={brief.depth === "deep" ? "cyan" : "default"}>
                    {brief.depth}
                  </Badge>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {brief.createdAt}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
