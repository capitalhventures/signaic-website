"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { exportTableToPDF } from "@/lib/export-pdf";

interface SecFiling {
  id: string;
  filing_type: string | null;
  filed_date: string | null;
  accession_number: string | null;
  cik: string | null;
  description: string | null;
  document_url: string | null;
  companies: { id: string; name: string } | null;
}

function getEdgarUrl(filing: SecFiling): string | null {
  // Best: direct archive link with CIK + accession number
  if (filing.cik && filing.accession_number) {
    return `https://www.sec.gov/Archives/edgar/data/${filing.cik}/${filing.accession_number.replace(/-/g, "")}/`;
  }
  // Fallback: company search filtered by form type
  if (filing.cik && filing.filing_type) {
    return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${filing.cik}&type=${encodeURIComponent(filing.filing_type)}&dateb=&owner=include&count=40`;
  }
  // Use existing URL if not a generic search
  if (filing.document_url && !filing.document_url.includes("action=getcompany&CIK=&")) {
    return filing.document_url;
  }
  return null;
}

const FILING_TYPE_COLORS: Record<string, string> = {
  "10-K": "bg-blue-50 text-blue-700 border-blue-200",
  "10-Q": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "8-K": "bg-amber-50 text-amber-700 border-amber-200",
  "4": "bg-green-50 text-green-700 border-green-200",
  "144": "bg-purple-50 text-purple-700 border-purple-200",
  "DEF 14A": "bg-pink-50 text-pink-700 border-pink-200",
  "DEFA14A": "bg-pink-50 text-pink-700 border-pink-200",
  "SC 13G": "bg-teal-50 text-teal-700 border-teal-200",
  "SC 13G/A": "bg-teal-50 text-teal-700 border-teal-200",
};

const PAGE_SIZE = 25;

export function SecFilingsClient({ filings }: { filings: SecFiling[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [page, setPage] = useState(0);

  const uniqueCompanies = useMemo(() => {
    const names = new Set<string>();
    filings.forEach((f) => {
      const name = (f.companies as { name: string } | null)?.name;
      if (name) names.add(name);
    });
    return Array.from(names).sort();
  }, [filings]);

  const handleExport = useCallback(
    (subset: SecFiling[], filterLabel?: string) => {
      const columns = ["Date", "Company", "Type", "Description"];
      const rows = subset.map((f) => [
        f.filed_date || "N/A",
        (f.companies as { name: string } | null)?.name || "Unknown",
        f.filing_type || "Unknown",
        f.description || "N/A",
      ]);
      exportTableToPDF({
        title: "SEC Filings",
        subtitle: `${subset.length} filing${subset.length !== 1 ? "s" : ""}`,
        columns,
        rows,
        filters: filterLabel,
        filename: `signaic-sec-filings${filterLabel ? "-" + filterLabel.toLowerCase().replace(/\s+/g, "-") : ""}.pdf`,
      });
    },
    []
  );

  const filtered = useMemo(() => {
    const now = new Date();
    return filings.filter((f) => {
      const matchesSearch =
        !search ||
        (f.description || "").toLowerCase().includes(search.toLowerCase()) ||
        (f.filing_type || "").toLowerCase().includes(search.toLowerCase()) ||
        ((f.companies as { name: string } | null)?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || f.filing_type === typeFilter;
      const matchesCompany = companyFilter === "all" || (f.companies as { name: string } | null)?.name === companyFilter;
      let matchesDate = true;
      if (dateRange !== "all" && f.filed_date) {
        const filedDate = new Date(f.filed_date);
        const daysAgo = new Date(now);
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        matchesDate = filedDate >= daysAgo;
      }
      return matchesSearch && matchesType && matchesCompany && matchesDate;
    });
  }, [filings, search, typeFilter, companyFilter, dateRange]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-chakra-petch)] text-[#00D4FF]">
            SEC Filings
          </h1>
          <p className="text-[#666666] text-sm mt-1">
            SEC EDGAR filings from public space & defense companies
          </p>
        </div>
        <ExportButton
          label="Export PDF"
          options={[
            {
              label: "Export All Filings",
              onClick: () => handleExport(filtered, search ? `Search: "${search}"` : undefined),
            },
            ...["10-K", "10-Q", "8-K"].map((type) => ({
              label: `Export: ${type} Filings`,
              onClick: () =>
                handleExport(
                  filtered.filter((f) => f.filing_type === type),
                  `Type: ${type}`
                ),
            })),
            ...uniqueCompanies.slice(0, 20).map((name) => ({
              label: `Export: ${name}`,
              onClick: () =>
                handleExport(
                  filtered.filter(
                    (f) => (f.companies as { name: string } | null)?.name === name
                  ),
                  `Company: ${name}`
                ),
            })),
          ]}
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by company, type, or description..."
            className="pl-10 bg-white border-[#d1d5db] text-[#333333] placeholder:text-[#999] focus:border-[#00D4FF]"
          />
        </div>

        <div className="flex items-center gap-1">
          {["all", "10-K", "10-Q", "8-K", "4", "144", "DEF 14A"].map((t) => {
            const isActive = typeFilter === t;
            const label = t === "all" ? "All" : t;
            return (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setPage(0); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#00D4FF]/20 text-[#0099BB] border border-[#00D4FF]/40 font-semibold"
                    : "text-[#666666] hover:text-[#333333] hover:bg-[#f5f6f8] border border-transparent"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <select
          value={companyFilter}
          onChange={(e) => { setCompanyFilter(e.target.value); setPage(0); }}
          className="bg-white border border-[#d1d5db] text-sm text-[#333333] rounded-md px-3 py-1.5 focus:border-[#00D4FF] focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 appearance-none cursor-pointer"
        >
          <option value="all">All Companies</option>
          {uniqueCompanies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={dateRange}
          onChange={(e) => { setDateRange(e.target.value); setPage(0); }}
          className="bg-white border border-[#d1d5db] text-sm text-[#333333] rounded-md px-3 py-1.5 focus:border-[#00D4FF] focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 appearance-none cursor-pointer"
        >
          <option value="all">All Time</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      <Card className="bg-white border-[#e2e4e8]" style={{ borderWidth: "0.5px" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#f0f0f2] hover:bg-transparent">
                <TableHead className="text-[#666666]">Date</TableHead>
                <TableHead className="text-[#666666]">Company</TableHead>
                <TableHead className="text-[#666666]">Type</TableHead>
                <TableHead className="text-[#666666]">Description</TableHead>
                <TableHead className="text-[#666666]">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[#666666] py-8">
                    No filings match your filters
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((filing, i) => (
                <TableRow
                  key={filing.id}
                  className={`border-[#f0f0f2] hover:bg-[#fafbfc] cursor-pointer ${i % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"}`}
                  onClick={() => {
                    if (filing.companies) {
                      router.push(`/entities/${(filing.companies as { id: string }).id}`);
                    }
                  }}
                >
                  <TableCell className="text-sm text-[#333333] whitespace-nowrap">
                    {filing.filed_date || "N/A"}
                  </TableCell>
                  <TableCell className="text-sm text-[#333333] font-medium">
                    {(filing.companies as { name: string } | null)?.name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${FILING_TYPE_COLORS[filing.filing_type || ""] || "bg-gray-50 text-gray-600 border-gray-200"}`}
                    >
                      {filing.filing_type || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#666666] max-w-xs truncate">
                    {filing.description || "N/A"}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const url = getEdgarUrl(filing);
                      return url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#00D4FF] hover:text-[#00D4FF]/80"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : null;
                    })()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#666666]">
            {filtered.length} filing{filtered.length !== 1 ? "s" : ""} found
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 border-[#d1d5db] text-[#666666]"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-[#666666]">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-8 border-[#d1d5db] text-[#666666]"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
