"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Company, FccFiling, OrbitalData, Patent, GovContract, NewsItem, SecFiling } from "@/lib/types";
import { ArrowLeft, Globe, Calendar, MapPin, ExternalLink, FileText, Satellite, Lightbulb, FileCheck, Newspaper, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cleanContractTitle } from "@/lib/utils/contracts";
import { ExportButton } from "@/components/export-button";
import { exportTableToPDF } from "@/lib/export-pdf";

function formatUSD(value: number | null): string {
  if (value == null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

function getContractStatus(contract: GovContract): "active" | "expired" | "expiring" {
  if (!contract.period_end) return "active";
  const endDate = new Date(contract.period_end);
  const now = new Date();
  const ninetyDays = new Date();
  ninetyDays.setDate(ninetyDays.getDate() + 90);
  if (endDate < now) return "expired";
  if (endDate < ninetyDays) return "expiring";
  return "active";
}

export function EntityDetailClient({
  company,
  filings,
  orbital,
  patents,
  contracts,
  news,
  secFilings = [],
}: {
  company: Company;
  filings: FccFiling[];
  orbital: OrbitalData[];
  patents: Patent[];
  contracts: GovContract[];
  news: NewsItem[];
  secFilings?: SecFiling[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const activeContracts = useMemo(
    () => contracts
      .filter((c) => getContractStatus(c) !== "expired")
      .sort((a, b) => (b.period_start || "").localeCompare(a.period_start || "")),
    [contracts]
  );

  const expiredContracts = useMemo(
    () => contracts
      .filter((c) => getContractStatus(c) === "expired")
      .sort((a, b) => (b.period_end || "").localeCompare(a.period_end || "")),
    [contracts]
  );

  const totalActiveContractValue = useMemo(
    () => activeContracts.reduce((sum, c) => sum + (c.contract_value || 0), 0),
    [activeContracts]
  );

  const categories = [
    { label: "FCC Filings", count: filings.length, tab: "fcc", icon: FileText },
    { label: "Orbital Objects", count: orbital.length, tab: "orbital", icon: Satellite },
    { label: "Patents", count: patents.length, tab: "patents", icon: Lightbulb },
    { label: "Contracts", count: contracts.length, tab: "contracts", icon: FileCheck },
    { label: "SEC Filings", count: secFilings.length, tab: "sec", icon: ScrollText },
    { label: "News", count: news.length, tab: "news", icon: Newspaper },
  ];

  function handleExportDossier() {
    const rows: (string | number)[][] = [];
    filings.forEach((f) => rows.push(["FCC", f.filing_date || "", f.file_number || "", f.applicant_name || "", f.status || ""]));
    orbital.forEach((o) => rows.push(["Orbital", o.launch_date || "", o.norad_cat_id || "", o.object_name || "", o.current_status || ""]));
    patents.forEach((p) => rows.push(["Patent", p.filing_date || "", p.patent_number || "", p.title || "", p.status || ""]));
    contracts.forEach((c) => rows.push(["Contract", c.period_start || "", c.contract_number || "", cleanContractTitle(c.contract_title, c.description) || "", formatUSD(c.contract_value)]));
    secFilings.forEach((s) => rows.push(["SEC", s.filed_date || "", s.accession_number || "", s.description || "", s.filing_type || ""]));
    news.forEach((n) => rows.push(["News", n.published_date || "", "", n.title || "", n.sentiment || ""]));

    exportTableToPDF({
      title: `Entity Dossier: ${company.name}`,
      subtitle: `${company.description || ""}\n${(company.sector_tags || []).join(", ")}`,
      columns: ["Source", "Date", "ID", "Title/Description", "Status/Value"],
      rows,
      filename: `signaic-dossier-${company.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`,
    });
  }

  const initials = company.name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/entities")}
        className="text-[#666666] hover:text-[#00D4FF] -ml-2 gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Entities
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4">
        {company.website ? (
          <img
            src={`https://logo.clearbit.com/${new URL(company.website).hostname}`}
            alt={company.name}
            className="w-12 h-12 rounded-lg object-contain bg-white border border-[#e2e4e8]"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              target.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div className={`w-12 h-12 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center font-bold text-[#00D4FF] font-[family-name:var(--font-chakra-petch)] text-lg ${company.website ? "hidden" : ""}`}>
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold text-[#00D4FF] font-[family-name:var(--font-chakra-petch)]">
              {company.name}
            </h1>
            <ExportButton label="Export Entity Dossier" onExport={handleExportDossier} />
          </div>
          <p className="text-[#666666] text-sm mt-1">
            {company.description || "No description available."}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[#666666]">
            {company.website && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span
                  onClick={() => window.open(company.website!, "_blank")}
                  className="text-[#00D4FF] hover:underline cursor-pointer"
                >
                  {company.website}
                </span>
              </span>
            )}
            {company.headquarters && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {company.headquarters}
              </span>
            )}
            {company.founded_year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Founded {company.founded_year}
              </span>
            )}
            {totalActiveContractValue > 0 && (
              <span className="flex items-center gap-1 text-[#0f6e56] font-medium">
                Total Active Contract Value: {formatUSD(totalActiveContractValue)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {(company.sector_tags || []).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] border-[#6366F1]/20 text-[#6366F1]">
                {tag}
              </Badge>
            ))}
            <Badge variant="outline" className="text-[10px] border-[#e2e4e8] text-[#666666]">
              {company.type || "private"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card
              key={cat.tab}
              className="bg-white border-[#e2e4e8] hover:border-[#00D4FF]/30 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => setActiveTab(cat.tab)}
            >
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#00D4FF]" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-[#111111]">{cat.count}</p>
                <p className="text-[10px] text-[#666666] mt-0.5">{cat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-[#e2e4e8] w-full overflow-x-auto flex-wrap">
          <TabsTrigger value="overview" className="text-[#555555] data-active:bg-transparent data-active:text-[#00D4FF] data-active:border-b-2 data-active:border-[#00D4FF] data-active:font-semibold data-active:shadow-none">Overview</TabsTrigger>
          <TabsTrigger value="fcc" className="text-[#555555] data-active:bg-transparent data-active:text-[#00D4FF] data-active:border-b-2 data-active:border-[#00D4FF] data-active:font-semibold data-active:shadow-none">FCC ({filings.length})</TabsTrigger>
          <TabsTrigger value="orbital" className="text-[#555555] data-active:bg-transparent data-active:text-[#00D4FF] data-active:border-b-2 data-active:border-[#00D4FF] data-active:font-semibold data-active:shadow-none">Orbital ({orbital.length})</TabsTrigger>
          <TabsTrigger value="patents" className="text-[#555555] data-active:bg-transparent data-active:text-[#00D4FF] data-active:border-b-2 data-active:border-[#00D4FF] data-active:font-semibold data-active:shadow-none">Patents ({patents.length})</TabsTrigger>
          <TabsTrigger value="contracts" className="text-[#555555] data-active:bg-transparent data-active:text-[#00D4FF] data-active:border-b-2 data-active:border-[#00D4FF] data-active:font-semibold data-active:shadow-none">Contracts ({contracts.length})</TabsTrigger>
          <TabsTrigger value="sec" className="text-[#555555] data-active:bg-transparent data-active:text-[#00D4FF] data-active:border-b-2 data-active:border-[#00D4FF] data-active:font-semibold data-active:shadow-none">SEC ({secFilings.length})</TabsTrigger>
          <TabsTrigger value="news" className="text-[#555555] data-active:bg-transparent data-active:text-[#00D4FF] data-active:border-b-2 data-active:border-[#00D4FF] data-active:font-semibold data-active:shadow-none">News ({news.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {company.ai_summary && (
            <Card className="bg-white border-[#f0f0f2]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#111111]">AI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#666666]">{company.ai_summary}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fcc" className="mt-4">
          <Card className="bg-white border-[#f0f0f2]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#f0f0f2]">
                    <TableHead className="text-[#666666]">Date</TableHead>
                    <TableHead className="text-[#666666]">File #</TableHead>
                    <TableHead className="text-[#666666]">Type</TableHead>
                    <TableHead className="text-[#666666]">Status</TableHead>
                    <TableHead className="text-[#666666]">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filings.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-[#666666] py-8">No filings</TableCell></TableRow>
                  )}
                  {filings.map((f) => (
                    <TableRow key={f.id} className="border-[#f0f0f2]">
                      <TableCell className="text-sm text-[#333333]">{f.filing_date || "N/A"}</TableCell>
                      <TableCell className="text-sm text-[#333333] font-mono">{f.file_number || "N/A"}</TableCell>
                      <TableCell className="text-sm text-[#333333]">{f.filing_type || "N/A"}</TableCell>
                      <TableCell className="text-sm text-[#333333]">{f.status || "N/A"}</TableCell>
                      <TableCell>
                        {f.file_number && (
                          <span
                            onClick={() => window.open(`https://www.google.com/search?q=site%3Afcc.gov+%22${encodeURIComponent(f.file_number || "")}%22`, "_blank", "noopener,noreferrer")}
                            className="text-[#00D4FF] hover:underline cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orbital" className="mt-4">
          <Card className="bg-white border-[#f0f0f2]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#f0f0f2]">
                    <TableHead className="text-[#666666]">Name</TableHead>
                    <TableHead className="text-[#666666]">NORAD ID</TableHead>
                    <TableHead className="text-[#666666]">Orbit</TableHead>
                    <TableHead className="text-[#666666]">Inclination</TableHead>
                    <TableHead className="text-[#666666]">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orbital.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-[#666666] py-8">
                      No orbital objects found.
                      <br />
                      <span className="text-[10px] text-[#999]">Note: Some recently launched objects may not yet appear in public Space-Track data.</span>
                    </TableCell></TableRow>
                  )}
                  {orbital.map((o) => (
                    <TableRow key={o.id} className="border-[#f0f0f2]">
                      <TableCell className="text-sm text-[#333333]">{o.object_name || "N/A"}</TableCell>
                      <TableCell className="text-sm text-[#333333] font-mono">{o.norad_cat_id || "N/A"}</TableCell>
                      <TableCell className="text-sm text-[#333333]">{o.orbit_type || "N/A"}</TableCell>
                      <TableCell className="text-sm text-[#333333]">{o.inclination != null ? `${o.inclination.toFixed(1)}°` : "N/A"}</TableCell>
                      <TableCell>
                        <span
                          onClick={() => window.open(`https://www.n2yo.com/satellite/?s=${o.norad_cat_id}`, "_blank", "noopener,noreferrer")}
                          className="text-[#00D4FF] hover:underline cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patents" className="mt-4">
          <Card className="bg-white border-[#f0f0f2]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#f0f0f2]">
                    <TableHead className="text-[#666666]">Title</TableHead>
                    <TableHead className="text-[#666666]">Patent #</TableHead>
                    <TableHead className="text-[#666666]">Date</TableHead>
                    <TableHead className="text-[#666666]">Area</TableHead>
                    <TableHead className="text-[#666666]">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patents.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-[#666666] py-8">No patents</TableCell></TableRow>
                  )}
                  {patents.map((p) => (
                    <TableRow key={p.id} className="border-[#f0f0f2]">
                      <TableCell className="text-sm text-[#333333] max-w-xs truncate">{p.title || "N/A"}</TableCell>
                      <TableCell className="text-sm text-[#333333] font-mono">{p.patent_number || "N/A"}</TableCell>
                      <TableCell className="text-sm text-[#333333]">{p.filing_date || "N/A"}</TableCell>
                      <TableCell className="text-sm text-[#333333]">{p.technology_area || "N/A"}</TableCell>
                      <TableCell>
                        {p.patent_number && (
                          <span
                            onClick={() => window.open(`https://patents.google.com/?q=${encodeURIComponent(p.patent_number || "")}`, "_blank", "noopener,noreferrer")}
                            className="text-[#00D4FF] hover:underline cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="mt-4 space-y-6">
          {/* Active Contracts */}
          <Card className="bg-white border-[#f0f0f2]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#111111]">
                Active Contracts
                <Badge className="ml-2 bg-green-50 text-green-700 border-green-200 text-[10px]">{activeContracts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#f0f0f2]">
                    <TableHead className="text-[#666666]">Title</TableHead>
                    <TableHead className="text-[#666666]">Agency</TableHead>
                    <TableHead className="text-[#666666]">Value</TableHead>
                    <TableHead className="text-[#666666]">Period</TableHead>
                    <TableHead className="text-[#666666]">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeContracts.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-[#666666] py-4">No active contracts</TableCell></TableRow>
                  )}
                  {activeContracts.map((c) => (
                    <TableRow key={c.id} className="border-[#f0f0f2]">
                      <TableCell className="text-sm text-[#333333] max-w-xs truncate">{cleanContractTitle(c.contract_title, c.description)}</TableCell>
                      <TableCell className="text-sm text-[#666666]">{c.awarding_agency || "N/A"}</TableCell>
                      <TableCell className="text-sm text-[#0f6e56] font-mono">{formatUSD(c.contract_value)}</TableCell>
                      <TableCell className="text-sm text-[#333333]">{c.period_start || "N/A"} - {c.period_end || "N/A"}</TableCell>
                      <TableCell>
                        <a
                          href={`https://www.usaspending.gov/search/?hash=&keyword=${encodeURIComponent(c.contract_number || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00D4FF] hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          {/* Expired Contracts */}
          <Card className="bg-white border-[#f0f0f2]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#111111]">
                Expired Contracts
                <Badge className="ml-2 bg-red-50 text-red-700 border-red-200 text-[10px]">{expiredContracts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#f0f0f2]">
                    <TableHead className="text-[#666666]">Title</TableHead>
                    <TableHead className="text-[#666666]">Agency</TableHead>
                    <TableHead className="text-[#666666]">Value</TableHead>
                    <TableHead className="text-[#666666]">Period</TableHead>
                    <TableHead className="text-[#666666]">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiredContracts.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-[#666666] py-4">No expired contracts</TableCell></TableRow>
                  )}
                  {expiredContracts.map((c) => (
                    <TableRow key={c.id} className="border-[#f0f0f2]">
                      <TableCell className="text-sm text-[#333333] max-w-xs truncate">{cleanContractTitle(c.contract_title, c.description)}</TableCell>
                      <TableCell className="text-sm text-[#666666]">{c.awarding_agency || "N/A"}</TableCell>
                      <TableCell className="text-sm text-[#0f6e56] font-mono">{formatUSD(c.contract_value)}</TableCell>
                      <TableCell className="text-sm text-[#333333]">{c.period_start || "N/A"} - {c.period_end || "N/A"}</TableCell>
                      <TableCell>
                        <a
                          href={`https://www.usaspending.gov/search/?hash=&keyword=${encodeURIComponent(c.contract_number || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00D4FF] hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sec" className="mt-4">
          <Card className="bg-white border-[#f0f0f2]">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#f0f0f2] hover:bg-transparent">
                    <TableHead className="text-[#666666]">Filed Date</TableHead>
                    <TableHead className="text-[#666666]">Type</TableHead>
                    <TableHead className="text-[#666666]">Description</TableHead>
                    <TableHead className="text-[#666666] w-10">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {secFilings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-[#666666] py-8">No SEC filings found</TableCell>
                    </TableRow>
                  )}
                  {secFilings.map((s) => {
                    const typeColors: Record<string, string> = {
                      "10-K": "bg-blue-50 text-blue-700 border-blue-200",
                      "10-Q": "bg-green-50 text-green-700 border-green-200",
                      "8-K": "bg-amber-50 text-amber-700 border-amber-200",
                    };
                    const badgeClass = typeColors[s.filing_type || ""] || "bg-gray-50 text-gray-700 border-gray-200";
                    return (
                      <TableRow key={s.id} className="border-[#f0f0f2] hover:bg-[#fafbfc]">
                        <TableCell className="text-sm text-[#333333]">{s.filed_date || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${badgeClass}`}>
                            {s.filing_type || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-[#333333] max-w-xs truncate">{s.description || "N/A"}</TableCell>
                        <TableCell>
                          {s.document_url ? (
                            <span
                              onClick={() => window.open(s.document_url!, "_blank", "noopener,noreferrer")}
                              className="text-[#00D4FF] hover:underline cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </span>
                          ) : s.accession_number ? (
                            <span
                              onClick={() => window.open(`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${company.ticker || ""}&type=${s.filing_type || ""}&dateb=&owner=include&count=40&search_text=&action=getcompany`, "_blank", "noopener,noreferrer")}
                              className="text-[#00D4FF] hover:underline cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="mt-4">
          <div className="space-y-3">
            {news.length === 0 && <p className="text-[#666666] text-sm text-center py-8">No news articles</p>}
            {news.map((n) => (
              <Card key={n.id} className="bg-white border-[#f0f0f2]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <span
                      onClick={() => n.url && window.open(n.url, "_blank")}
                      className="text-sm text-[#333333] hover:text-[#00D4FF] cursor-pointer flex-1"
                    >
                      {n.title || "Untitled"}
                    </span>
                    {n.url && (
                      <span
                        onClick={() => window.open(n.url!, "_blank", "noopener,noreferrer")}
                        className="text-[#00D4FF] shrink-0 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#666666] mt-1">{n.summary || ""}</p>
                  <div className="flex items-center gap-2 text-[10px] text-[#999999] mt-2">
                    <span>{n.source || "Unknown"}</span>
                    <span>&#183;</span>
                    <span>{n.published_date || "Unknown date"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
