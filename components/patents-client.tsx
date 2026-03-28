"use client";

import { useState, useMemo, useCallback, useEffect, useRef, Fragment } from "react";
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
import { Search, ChevronDown, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon, ExternalLink } from "lucide-react";

import { ExportButton } from "@/components/export-button";
import { exportTableToPDF } from "@/lib/export-pdf";

interface PatentItem {
  id: string;
  patent_number: string | null;
  title: string | null;
  abstract: string | null;
  filing_date: string | null;
  status: string | null;
  technology_area: string | null;
  companies: { id: string; name: string } | null;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function PatentsClient({ patents }: { patents: PatentItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [expandedId, setExpandedId] = useState<string | null>(highlightId);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const statusOrder: Record<string, number> = { granted: 0, pending: 1 };
    return patents
      .filter(
        (p) =>
          !q ||
          p.title?.toLowerCase().includes(q) ||
          (p.companies as { name: string } | null)?.name?.toLowerCase().includes(q) ||
          p.patent_number?.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const aStatus = (a.status || "unknown").toLowerCase();
        const bStatus = (b.status || "unknown").toLowerCase();
        const aOrder = statusOrder[aStatus] ?? 99;
        const bOrder = statusOrder[bStatus] ?? 99;
        return aOrder - bOrder;
      });
  }, [patents, search]);

  const statusGroups = useMemo(() => {
    const groups: Record<string, PatentItem[]> = {};
    const order = ["granted", "pending"];
    filtered.forEach((p) => {
      const s = (p.status || "unknown").toLowerCase();
      if (!groups[s]) groups[s] = [];
      groups[s].push(p);
    });
    // Collect any statuses not in order
    const remaining = Object.keys(groups).filter((s) => !order.includes(s));
    return [...order, ...remaining]
      .filter((s) => groups[s]?.length)
      .map((s) => ({ status: s, label: s.charAt(0).toUpperCase() + s.slice(1), items: groups[s] }));
  }, [filtered]);

  const uniqueAssignees = useMemo(() => {
    const names = new Set<string>();
    patents.forEach((p) => {
      if (p.companies?.name) names.add(p.companies.name);
    });
    return Array.from(names).sort();
  }, [patents]);

  const handleExport = useCallback(
    (subset: PatentItem[], filterLabel?: string) => {
      const columns = [
        "Title",
        "Assignee",
        "Patent #",
        "Filing Date",
        "Status",
        "Technology Area",
      ];
      const rows = subset.map((p) => [
        p.title || "Untitled",
        p.companies?.name || "Unknown",
        p.patent_number || "N/A",
        p.filing_date || "N/A",
        p.status || "Unknown",
        p.technology_area || "N/A",
      ]);
      exportTableToPDF({
        title: "Patents",
        subtitle: `${subset.length} patent${subset.length !== 1 ? "s" : ""}`,
        columns,
        rows,
        filters: filterLabel,
        filename: `signaic-patents${filterLabel ? "-" + filterLabel.toLowerCase().replace(/\s+/g, "-") : ""}.pdf`,
      });
    },
    []
  );

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
            Patents
          </h1>
          <p className="text-[#666666] text-sm mt-1">
            Space & defense patent filings from USPTO
          </p>
        </div>
        <ExportButton
          label="Export PDF"
          options={[
            {
              label: "Export All Patents",
              onClick: () => handleExport(filtered, search ? `Search: "${search}"` : undefined),
            },
            {
              label: "Export Granted Only",
              onClick: () =>
                handleExport(
                  filtered.filter((p) => p.status?.toLowerCase() === "granted"),
                  "Status: Granted"
                ),
            },
            {
              label: "Export Pending Only",
              onClick: () =>
                handleExport(
                  filtered.filter((p) => p.status?.toLowerCase() === "pending"),
                  "Status: Pending"
                ),
            },
            ...uniqueAssignees.slice(0, 20).map((name) => ({
              label: `Export: ${name}`,
              onClick: () =>
                handleExport(
                  filtered.filter((p) => p.companies?.name === name),
                  `Assignee: ${name}`
                ),
            })),
          ]}
        />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search by title or assignee..."
          className="pl-10 bg-white border-[#d1d5db] text-[#333333]"
        />
      </div>

      <Card className="bg-white border-[#f0f0f2]" style={{ borderWidth: "0.5px" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#f0f0f2] hover:bg-transparent">
                <TableHead className="text-[#666666]">Title</TableHead>
                <TableHead className="text-[#666666]">Assignee</TableHead>
                <TableHead className="text-[#666666]">Filing Date</TableHead>
                <TableHead className="text-[#666666]">Status</TableHead>
                <TableHead className="text-[#666666]">Technology Area</TableHead>
                <TableHead className="text-[#666666] w-10">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-[#666666] py-8">
                    No patents found
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((patent, idx) => {
                const currentStatus = (patent.status || "Unknown").toLowerCase();
                const prevStatus = idx > 0 ? (pageData[idx - 1].status || "Unknown").toLowerCase() : null;
                const showGroupHeader = currentStatus !== prevStatus;
                const isCollapsed = collapsedGroups[currentStatus];
                const statusLabel = currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1);
                const groupCount = statusGroups?.find((g) => g.status === currentStatus)?.items.length || 0;

                return (
                <Fragment key={patent.id}>
                  {showGroupHeader && (
                    <TableRow
                      className="bg-[#f8f9fb] hover:bg-[#f0f2f5] cursor-pointer"
                      onClick={() => setCollapsedGroups((prev) => ({ ...prev, [currentStatus]: !prev[currentStatus] }))}
                    >
                      <TableCell colSpan={6}>
                        <div className="flex items-center gap-2">
                          {isCollapsed ? <ChevronRightIcon className="w-4 h-4 text-[#666]" /> : <ChevronDown className="w-4 h-4 text-[#666]" />}
                          <span className="text-sm font-semibold text-[#333] font-[family-name:var(--font-chakra-petch)]">{statusLabel}</span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-700">{groupCount}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isCollapsed && (<>
                  <TableRow
                    ref={patent.id === highlightId ? highlightRef : undefined}
                    className={`border-[#f0f0f2] cursor-pointer hover:bg-[#fafbfc] ${patent.id === highlightId ? "bg-[#e6f9ff]" : ""}`}
                    onClick={() =>
                      setExpandedId(expandedId === patent.id ? null : patent.id)
                    }
                  >
                    <TableCell className="text-sm text-[#333333] max-w-xs truncate">
                      <div className="flex items-center gap-1">
                        {patent.title || "Untitled"}
                        <ChevronDown className="w-3 h-3 text-[#666666] shrink-0" />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {patent.companies ? (
                        <span
                          className="text-[#00D4FF] hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/entities/${(patent.companies as { id: string }).id}`);
                          }}
                        >
                          {(patent.companies as { name: string }).name}
                        </span>
                      ) : (
                        <span className="text-[#333333]">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[#333333]">
                      {patent.filing_date || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] border-[#e2e4e8] text-[#666666]">
                        {patent.status || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#666666]">
                      {patent.technology_area || "N/A"}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://patents.google.com/?q=${encodeURIComponent(patent.patent_number || patent.title || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#00D4FF] hover:text-[#00D4FF]/80"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </TableCell>
                  </TableRow>
                  {expandedId === patent.id && (
                    <TableRow className="border-[#f0f0f2]">
                      <TableCell colSpan={6} className="bg-[#fafbfc] p-4">
                        <p className="text-xs text-[#666666] mb-1">
                          Patent #{patent.patent_number}
                        </p>
                        <p className="text-xs text-[#666666] mb-2">
                          {patent.abstract
                            ? patent.abstract.slice(0, 500) + (patent.abstract.length > 500 ? "..." : "")
                            : "No abstract available."}
                        </p>
                        <a
                          href={`https://patents.google.com/?q=${encodeURIComponent(patent.patent_number || patent.title || "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#00D4FF] hover:underline"
                        >
                          View on Google Patents
                          <ExternalLink className="w-3 h-3" />
                        </a>
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
            {filtered.length} patent{filtered.length !== 1 ? "s" : ""} total
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
