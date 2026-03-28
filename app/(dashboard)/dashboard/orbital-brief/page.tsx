"use client";

import { useState, useEffect } from "react";
import { Card, Badge, Button, Select } from "@/components/ui";
import {
  FileText,
  Download,
  Clock,
  Loader2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type jsPDFType from "jspdf";

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
  config: { depth?: string } | null;
  created_at: string;
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function OrbitalBriefPage() {
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [depth, setDepth] = useState("standard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [recentBriefs, setRecentBriefs] = useState<RecentBrief[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch recent briefs from database
  useEffect(() => {
    async function fetchBriefs() {
      try {
        const res = await fetch("/api/v1/briefs");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data) {
          setRecentBriefs(json.data);
        }
      } catch {
        // No briefs available
      }
    }
    fetchBriefs();
  }, []);

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
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            end: new Date().toISOString().split("T")[0],
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate brief");

      const result = await response.json();
      setGeneratedContent(
        result.data?.content ||
          "Brief generation complete. Please authenticate to view results."
      );

      // Refresh recent briefs list
      try {
        const res = await fetch("/api/v1/briefs");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setRecentBriefs(json.data);
          }
        }
      } catch {
        // Ignore
      }
    } catch {
      setGeneratedContent(
        "Unable to generate brief. Please ensure you're authenticated and try again."
      );
    } finally {
      setIsGenerating(false);
      setProgress("");
    }
  };

  const handleExportPDF = async () => {
    if (!generatedContent) return;
    setIsExporting(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc: jsPDFType = new jsPDF({ orientation: "portrait" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // SIG/NAIC branded header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 17, 17);
      doc.text("SIG/NAIC", 14, 18);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(102, 102, 102);
      doc.text("SPACE INTELLIGENCE", 50, 18);

      // Cyan accent line
      doc.setDrawColor(6, 182, 212);
      doc.setLineWidth(1.5);
      doc.line(14, 22, pageWidth - 14, 22);

      // Title
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 17, 17);
      doc.text("The Orbital Brief", 14, 32);

      // Date range
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      const formatDate = (d: Date) =>
        d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(102, 102, 102);
      doc.text(`${formatDate(startDate)} — ${formatDate(endDate)}`, 14, 38);

      // Sectors
      if (selectedSectors.length > 0) {
        doc.setFontSize(8);
        doc.text(`Sectors: ${selectedSectors.join(", ")}`, 14, 44);
      }

      // Content
      let y = selectedSectors.length > 0 ? 52 : 46;
      const marginLeft = 14;
      const maxWidth = pageWidth - 28;

      const lines = doc.splitTextToSize(generatedContent, maxWidth);
      doc.setFontSize(10);
      doc.setTextColor(51, 51, 51);

      for (const line of lines) {
        if (y > pageHeight - 25) {
          doc.addPage();
          y = 20;
        }

        // Section headers in cyan
        if (
          line.startsWith("##") ||
          line.startsWith("**") ||
          (line.length < 60 && line === line.toUpperCase() && line.trim().length > 3)
        ) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(6, 182, 212);
          doc.text(line.replace(/^#+\s*/, "").replace(/\*\*/g, ""), marginLeft, y);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(51, 51, 51);
        } else {
          doc.text(line, marginLeft, y);
        }
        y += 5;
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(153, 153, 153);
        doc.text("Generated by SIG/NAIC | signaic.com", 14, pageHeight - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 40, pageHeight - 10);
      }

      const today = new Date().toISOString().split("T")[0];
      doc.save(`orbital-brief-${today}.pdf`);
    } catch {
      // PDF generation failed silently
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  defaultValue={
                    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0]
                  }
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
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    loading={isExporting}
                  >
                    {isExporting ? (
                      "Exporting..."
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Export PDF
                      </>
                    )}
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
        <div className="w-full lg:w-72 flex-shrink-0">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Recent Briefs
          </h3>
          <div className="space-y-2">
            {recentBriefs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                No briefs generated yet.
              </p>
            ) : (
              recentBriefs.map((brief) => (
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
                    <Badge
                      variant={
                        brief.config?.depth === "deep" ? "cyan" : "default"
                      }
                    >
                      {brief.config?.depth || "standard"}
                    </Badge>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(brief.created_at)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
