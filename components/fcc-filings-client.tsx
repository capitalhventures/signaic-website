"use client";

import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ExternalLink, ChevronRight as ChevronRightIcon } from "lucide-react";

import { ExportButton } from "@/components/export-button";
import { exportTableToPDF } from "@/lib/export-pdf";

interface Filing {
  id: string;
  file_number: string | null;
  applicant_name: string | null;
  filing_type: string | null;
  filing_date: string | null;
  status: string | null;
  frequency_bands: string[];
  raw_text: string | null;
  ai_summary: string | null;
  company_id: string | null;
  companies: { id: string; name: string } | null;
}

function statusColor(status: string | null) {
  switch (status?.toLowerCase()) {
    case "granted":
      return "bg-[#e6f9f0] text-[#0f6e56] border-[#b0e8d0]";
    case "pending":
      return "bg-[#fef5e1] text-[#854f0b] border-[#fcd97e]";
    case "denied":
      return "bg-[#fce8e8] text-[#991f1f] border-[#f5bcbc]";
    default:
      return "bg-[#f0f2f5] text-[#666666] border-[#e2e4e8]";
  }
}

type SortField = "filing_date" | "applicant_name" | "filing_type" | "status";

const DATE_RANGE_OPTIONS = [
  { label: "All time", value: "all" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "Last year", value: "365" },
] as const;

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function FccFilingsClient({ filings }: { filings: Filing[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortField, setSortField] = useState<SortField>("filing_date");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(highlightId);
  const highlightRef = useRef<HTMLTableRowElement>(null);

  // Filter state
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId]);

  // Derive unique types and statuses
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    filings.forEach((f) => {
      if (f.filing_type) types.add(f.filing_type);
    });
    return Array.from(types).sort();
  }, [filings]);

  const statusCounts = useMemo(() => {
    const q = search.toLowerCase();
    const now = new Date();
    const base = filings.filter((f) => {
      if (
        q &&
        !f.applicant_name?.toLowerCase().includes(q) &&
        !f.file_number?.toLowerCase().includes(q) &&
        !(f.companies as { name: string } | null)?.name?.toLowerCase().includes(q)
      )
        return false;
      if (typeFilter !== "all" && f.filing_type !== typeFilter) return false;
      if (dateRange !== "all" && f.filing_date) {
        const filingDate = new Date(f.filing_date);
        const daysAgo = new Date(now);
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        if (filingDate < daysAgo) return false;
      }
      return true;
    });
    const counts: Record<string, number> = { all: base.length };
    base.forEach((f) => {
      const s = (f.status || "Unknown").toLowerCase();
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [filings, search, typeFilter, dateRange]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const now = new Date();

    return filings
      .filter((f) => {
        // Text search
        if (
          q &&
          !f.applicant_name?.toLowerCase().includes(q) &&
          !f.file_number?.toLowerCase().includes(q) &&
          !(f.companies as { name: string } | null)?.name?.toLowerCase().includes(q)
        ) {
          return false;
        }

        // Type filter
        if (typeFilter !== "all" && f.filing_type !== typeFilter) return false;

        // Status filter
        if (statusFilter !== "all" && f.status?.toLowerCase() !== statusFilter) return false;

        // Date range filter
        if (dateRange !== "all" && f.filing_date) {
          const filingDate = new Date(f.filing_date);
          const daysAgo = new Date(now);
          daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
          if (filingDate < daysAgo) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aVal = a[sortField] || "";
        const bVal = b[sortField] || "";
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
  }, [filings, search, sortField, sortAsc, typeFilter, statusFilter, dateRange]);

  const statusGroups = useMemo(() => {
    if (statusFilter !== "all") return null;
    const groups: Record<string, Filing[]> = {};
    const order = ["granted", "pending", "notice", "denied", "unknown"];
    filtered.forEach((f) => {
      const s = (f.status || "unknown").toLowerCase();
      if (!groups[s]) groups[s] = [];
      groups[s].push(f);
    });
    return order
      .filter((s) => groups[s]?.length)
      .map((s) => ({ status: s, label: s.charAt(0).toUpperCase() + s.slice(1), items: groups[s] }));
  }, [filtered, statusFilter]);

  const showAll = pageSize === 0;
  const effectivePageSize = showAll ? filtered.length : pageSize;
  const pageCount = showAll ? 1 : Math.ceil(filtered.length / effectivePageSize);
  const pageData = showAll ? filtered : filtered.slice(page * effectivePageSize, (page + 1) * effectivePageSize);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  }

  function renderSortIcon(field: SortField) {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 inline ml-1 opacity-0" />;
    return sortAsc
      ? <ChevronUp className="w-3 h-3 inline ml-1" />
      : <ChevronDown className="w-3 h-3 inline ml-1" />;
  }

  function resetFilters() {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setDateRange("all");
    setPage(0);
  }

  const uniqueApplicants = useMemo(() => {
    const names = new Set<string>();
    filings.forEach((f) => {
      if (f.applicant_name) names.add(f.applicant_name);
    });
    return Array.from(names).sort();
  }, [filings]);

  function handleExport(applicantFilter?: string) {
    const data = applicantFilter
      ? filtered.filter((f) => f.applicant_name === applicantFilter)
      : filtered;
    const filterDesc = [
      statusFilter !== "all" ? `Status: ${statusFilter}` : "",
      typeFilter !== "all" ? `Type: ${typeFilter}` : "",
      applicantFilter ? `Applicant: ${applicantFilter}` : "",
      dateRange !== "all" ? `Last ${dateRange} days` : "",
    ].filter(Boolean).join(", ");

    exportTableToPDF({
      title: "FCC Filings",
      subtitle: `${data.length} filings`,
      columns: ["Filing Date", "File Number", "Applicant", "Type", "Status", "Frequency Bands"],
      rows: data.map((f) => [
        f.filing_date || "N/A",
        f.file_number || "N/A",
        f.applicant_name || "N/A",
        f.filing_type || "N/A",
        f.status || "N/A",
        (f.frequency_bands || []).join(", ") || "N/A",
      ]),
      filters: filterDesc || undefined,
      filename: `signaic-fcc-filings-${new Date().toISOString().split("T")[0]}.pdf`,
    });
  }

  const hasActiveFilters = typeFilter !== "all" || statusFilter !== "all" || dateRange !== "all" || search !== "";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-chakra-petch)] text-[#00D4FF]">
            FCC Filings
          </h1>
          <p className="text-[#666666] text-sm mt-1">
            Federal Communications Commission satellite filings
          </p>
        </div>
        <ExportButton
          label="Export PDF"
          options={[
            { label: "Export All Filings", onClick: () => handleExport() },
            { label: "Export Granted Only", onClick: () => { setStatusFilter("granted"); setTimeout(() => handleExport(), 0); } },
            { label: "Export Pending Only", onClick: () => { setStatusFilter("pending"); setTimeout(() => handleExport(), 0); } },
            ...uniqueApplicants.slice(0, 20).map((name) => ({
              label: `Export: ${name}`,
              onClick: () => handleExport(name),
            })),
          ]}
        />
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by applicant or file number..."
            className="pl-10 bg-white border-[#d1d5db] text-[#333333] focus:border-[#00D4FF]"
          />
        </div>

        <div className="flex items-center gap-1">
          {["all", "pending", "granted", "denied"].map((s) => {
            const count = statusCounts[s] || 0;
            const isActive = statusFilter === s;
            const label = s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1);
            return (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(0); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#00D4FF]/20 text-[#0099BB] border border-[#00D4FF]/40 font-semibold"
                    : "text-[#666666] hover:text-[#333333] hover:bg-[#f5f6f8] border border-transparent"
                }`}
              >
                {label} ({s === "all" ? statusCounts.all || 0 : count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
            className="bg-white border border-[#d1d5db] text-sm text-[#333333] rounded-md px-3 py-1.5 focus:border-[#00D4FF] focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 appearance-none cursor-pointer"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => { setDateRange(e.target.value); setPage(0); }}
            className="bg-white border border-[#d1d5db] text-sm text-[#333333] rounded-md px-3 py-1.5 focus:border-[#00D4FF] focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 appearance-none cursor-pointer"
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-[#00D4FF] hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <Card className="bg-white border-[#e2e4e8]" style={{ borderWidth: "0.5px" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#f0f0f2] hover:bg-transparent">
                <TableHead
                  className="text-[#666666] cursor-pointer select-none hover:text-[#111111] transition-colors"
                  onClick={() => toggleSort("filing_date")}
                >
                  Filing Date
                  {renderSortIcon("filing_date")}
                </TableHead>
                <TableHead className="text-[#666666]">File Number</TableHead>
                <TableHead
                  className="text-[#666666] cursor-pointer select-none hover:text-[#111111] transition-colors"
                  onClick={() => toggleSort("applicant_name")}
                >
                  Applicant
                  {renderSortIcon("applicant_name")}
                </TableHead>
                <TableHead
                  className="text-[#666666] cursor-pointer select-none hover:text-[#111111] transition-colors"
                  onClick={() => toggleSort("filing_type")}
                >
                  Type
                  {renderSortIcon("filing_type")}
                </TableHead>
                <TableHead
                  className="text-[#666666] cursor-pointer select-none hover:text-[#111111] transition-colors"
                  onClick={() => toggleSort("status")}
                >
                  Status
                  {renderSortIcon("status")}
                </TableHead>
                <TableHead className="text-[#666666]">Frequency Bands</TableHead>
                <TableHead className="text-[#666666] w-10">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[#666666] py-8">
                    No filings found
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((filing, idx) => {
                const currentStatus = (filing.status || "Unknown").toLowerCase();
                const prevStatus = idx > 0 ? (pageData[idx - 1].status || "Unknown").toLowerCase() : null;
                const showGroupHeader = statusFilter === "all" && currentStatus !== prevStatus;
                const isCollapsed = collapsedGroups[currentStatus];
                const statusLabel = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
                const groupCount = statusGroups?.find((g) => g.status === currentStatus)?.items.length || 0;
                const badgeColors: Record<string, string> = {
                  granted: "bg-green-50 text-green-700",
                  pending: "bg-amber-50 text-amber-700",
                  denied: "bg-red-50 text-red-700",
                };

                return (
                <Fragment key={filing.id}>
                  {showGroupHeader && (
                    <TableRow
                      className="bg-[#f8f9fb] hover:bg-[#f0f2f5] cursor-pointer"
                      onClick={() => setCollapsedGroups((prev) => ({ ...prev, [currentStatus]: !prev[currentStatus] }))}
                    >
                      <TableCell colSpan={7} className="py-2">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? <ChevronRightIcon className="w-4 h-4 text-[#666]" /> : <ChevronDown className="w-4 h-4 text-[#666]" />}
                          <span className="text-sm font-semibold text-[#333] font-[family-name:var(--font-chakra-petch)]">{statusLabel}</span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeColors[currentStatus] || "bg-gray-50 text-gray-700"}`}>{groupCount}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isCollapsed && (<>
                  <TableRow
                    ref={filing.id === highlightId ? highlightRef : undefined}
                    className={`border-[#f0f0f2] cursor-pointer hover:bg-[#fafbfc] ${filing.id === highlightId ? "bg-[#e6f9ff]" : ""}`}
                    onClick={() =>
                      setExpandedId(expandedId === filing.id ? null : filing.id)
                    }
                  >
                    <TableCell className="text-sm text-[#333333]">
                      {filing.filing_date || "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-[#333333] font-mono">
                      {filing.file_number || "N/A"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {filing.companies ? (
                        <span
                          className="text-[#00D4FF] hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/entities/${(filing.companies as { id: string }).id}`);
                          }}
                        >
                          {(filing.companies as { name: string }).name}
                        </span>
                      ) : (
                        <span className="text-[#333333]">
                          {filing.applicant_name || "Unknown"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[#333333]">
                      {filing.filing_type || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${statusColor(filing.status)}`}
                      >
                        {filing.status || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[#666666]">
                      {(filing.frequency_bands || []).join(", ") || "N/A"}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://www.google.com/search?q=site%3Afcc.gov+%22${encodeURIComponent(filing.file_number || "")}%22`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#00D4FF] hover:text-[#00D4FF]/80"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </TableCell>
                  </TableRow>
                  {expandedId === filing.id && (
                    <TableRow className="border-[#f0f0f2]">
                      <TableCell colSpan={7} className="bg-[#fafbfc] p-4">
                        <p className="text-xs text-[#666666]">
                          {filing.ai_summary
                            ? filing.ai_summary.slice(0, 500)
                            : filing.raw_text?.slice(0, 500) ||
                              "No additional details available."}
                          {((filing.ai_summary && filing.ai_summary.length > 500) ||
                            (!filing.ai_summary && filing.raw_text && filing.raw_text.length > 500)) &&
                            "..."}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                  </>)}
                </Fragment>
              );
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#666666]">
            {filtered.length} filing{filtered.length !== 1 ? "s" : ""} total
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setPageSize(val);
              setPage(0);
            }}
            className="bg-white border border-[#d1d5db] text-xs text-[#333333] rounded-md px-2 py-1 focus:border-[#00D4FF] focus:outline-none focus:ring-1 focus:ring-[#00D4FF]/20 appearance-none cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size} per page</option>
            ))}
            <option value={0}>All</option>
          </select>
        </div>
        {pageCount > 1 && (
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
        )}
      </div>
    </div>
  );
}
