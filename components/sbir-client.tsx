"use client";

import { useState, useMemo, useCallback } from "react";
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

interface SbirAward {
  id: string;
  agency: string | null;
  branch: string | null;
  program: string | null;
  award_year: number | null;
  company: string | null;
  award_amount: number | null;
  title: string | null;
  abstract: string | null;
  phase: string | null;
  topic_code: string | null;
}

const DEFAULT_PAGE_SIZE = 10;

export function SbirClient({
  awards,
  error,
}: {
  awards: SbirAward[];
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const uniqueAgencies = useMemo(() => {
    const set = new Set<string>();
    awards.forEach((a) => {
      if (a.agency) set.add(a.agency);
    });
    return Array.from(set).sort();
  }, [awards]);

  const uniquePhases = useMemo(() => {
    const set = new Set<string>();
    awards.forEach((a) => {
      if (a.phase) set.add(a.phase);
    });
    return Array.from(set).sort();
  }, [awards]);

  const uniqueCompanies = useMemo(() => {
    const set = new Set<string>();
    awards.forEach((a) => {
      if (a.company) set.add(a.company);
    });
    return Array.from(set).sort();
  }, [awards]);

  const handleExport = useCallback(
    (subset: SbirAward[], filterLabel?: string) => {
      const columns = ["Year", "Company", "Title", "Agency", "Phase", "Amount"];
      const rows = subset.map((a) => [
        a.award_year ? String(a.award_year) : "N/A",
        a.company || "N/A",
        a.title || "N/A",
        a.agency || "N/A",
        a.phase || "N/A",
        a.award_amount ? `$${a.award_amount.toLocaleString()}` : "N/A",
      ]);
      exportTableToPDF({
        title: "SBIR/STTR Awards",
        subtitle: `${subset.length} award${subset.length !== 1 ? "s" : ""}`,
        columns,
        rows,
        filters: filterLabel,
        filename: `signaic-sbir-awards${filterLabel ? "-" + filterLabel.toLowerCase().replace(/\s+/g, "-") : ""}.pdf`,
      });
    },
    []
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const results = awards.filter((a) => {
      if (
        q &&
        !a.title?.toLowerCase().includes(q) &&
        !a.company?.toLowerCase().includes(q) &&
        !a.abstract?.toLowerCase().includes(q)
      )
        return false;
      if (agencyFilter !== "all" && a.agency !== agencyFilter) return false;
      if (phaseFilter !== "all" && a.phase !== phaseFilter) return false;
      return true;
    });
    // Default sort by most recent award_year first
    results.sort((a, b) => (b.award_year ?? 0) - (a.award_year ?? 0));
    return results;
  }, [awards, search, agencyFilter, phaseFilter]);

  const showAll = pageSize === 0;
  const effectivePageSize = showAll ? filtered.length : pageSize;
  const pageCount = showAll ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const pageData = showAll
    ? filtered
    : filtered.slice(page * effectivePageSize, (page + 1) * effectivePageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-chakra-petch)] text-[#00D4FF]">
            SBIR/STTR Awards
          </h1>
          <p className="text-[#666666] text-sm mt-1">
            Small business innovation research and technology transfer awards.
          </p>
        </div>
        <ExportButton
          label="Export PDF"
          options={[
            {
              label: "Export All Awards",
              onClick: () => handleExport(filtered, search ? `Search: "${search}"` : undefined),
            },
            ...uniqueAgencies.slice(0, 15).map((agency) => ({
              label: `Export Agency: ${agency}`,
              onClick: () =>
                handleExport(
                  filtered.filter((a) => a.agency === agency),
                  `Agency: ${agency}`
                ),
            })),
            ...uniquePhases.map((phase) => ({
              label: `Export Phase: ${phase}`,
              onClick: () =>
                handleExport(
                  filtered.filter((a) => a.phase === phase),
                  `Phase: ${phase}`
                ),
            })),
            ...uniqueCompanies.slice(0, 20).map((company) => ({
              label: `Export: ${company}`,
              onClick: () =>
                handleExport(
                  filtered.filter((a) => a.company === company),
                  `Company: ${company}`
                ),
            })),
          ]}
        />
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[#fef5e1] border border-[#fcd97e]">
          <p className="text-sm text-[#854f0b]">
            Unable to load awards. Please try again later.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search awards..."
            className="pl-10 bg-white border-[#d1d5db] text-[#333333] placeholder:text-[#999] focus:border-[#00D4FF]"
          />
        </div>
        <select
          value={agencyFilter}
          onChange={(e) => {
            setAgencyFilter(e.target.value);
            setPage(0);
          }}
          className="bg-white border border-[#d1d5db] text-sm text-[#333333] rounded-md px-3 py-2 focus:border-[#00D4FF] focus:outline-none appearance-none cursor-pointer"
        >
          <option value="all">All Agencies</option>
          {uniqueAgencies.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={phaseFilter}
          onChange={(e) => {
            setPhaseFilter(e.target.value);
            setPage(0);
          }}
          className="bg-white border border-[#d1d5db] text-sm text-[#333333] rounded-md px-3 py-2 focus:border-[#00D4FF] focus:outline-none appearance-none cursor-pointer"
        >
          <option value="all">All Phases</option>
          {uniquePhases.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={pageSize}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setPageSize(val);
            setPage(0);
          }}
          className="bg-white border border-[#d1d5db] text-sm text-[#333333] rounded-md px-3 py-2 focus:border-[#00D4FF] focus:outline-none appearance-none cursor-pointer"
        >
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
          <option value={50}>50 per page</option>
          <option value={0}>All</option>
        </select>
      </div>

      <Card className="bg-white border-[#e2e4e8]" style={{ borderWidth: "0.5px" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#f0f0f2]">
                <TableHead className="text-[#666666]">Year</TableHead>
                <TableHead className="text-[#666666]">Company</TableHead>
                <TableHead className="text-[#666666]">Title</TableHead>
                <TableHead className="text-[#666666]">Agency</TableHead>
                <TableHead className="text-[#666666]">Phase</TableHead>
                <TableHead className="text-[#666666] text-right">Amount</TableHead>
                <TableHead className="text-[#666666]">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[#666666] py-8">
                    {awards.length === 0
                      ? "SBIR/STTR data is temporarily unavailable. The SBIR.gov API is currently unreachable (DNS failure). Last checked: March 23, 2026. The system will automatically refresh when the service is restored."
                      : "No awards match your filters"}
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((award, i) => (
                <TableRow
                  key={award.id}
                  className={`border-[#f0f0f2] hover:bg-[#fafbfc] cursor-pointer ${i % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"}`}
                  onClick={() =>
                    setExpandedId(expandedId === award.id ? null : award.id)
                  }
                >
                  <TableCell className="text-sm text-[#333333]">
                    {award.award_year || "N/A"}
                  </TableCell>
                  <TableCell className="text-sm text-[#333333] font-medium">
                    {award.company || "N/A"}
                  </TableCell>
                  <TableCell className="text-sm text-[#333333] max-w-xs truncate">
                    {award.title || "N/A"}
                  </TableCell>
                  <TableCell className="text-xs text-[#666666]">
                    {award.agency || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-[#f0f2f5] text-[#333333] border-[#e2e4e8]"
                    >
                      {award.phase || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[#333333] text-right font-mono">
                    {award.award_amount
                      ? `$${award.award_amount.toLocaleString()}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <a
                      href={`https://www.sbir.gov/node/${award.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00D4FF] hover:underline inline-flex items-center gap-1 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#666666]">
            {filtered.length} award{filtered.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="border-[#d1d5db] text-[#666666]"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-[#666666]">
              Page {page + 1} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
              disabled={page >= pageCount - 1}
              className="border-[#d1d5db] text-[#666666]"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
