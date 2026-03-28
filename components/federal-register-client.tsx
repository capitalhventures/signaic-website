"use client";

import { useState, useMemo, useCallback, Fragment } from "react";
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
import { Search, ExternalLink, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon, ChevronDown } from "lucide-react";

import { ExportButton } from "@/components/export-button";
import { exportTableToPDF } from "@/lib/export-pdf";

interface FederalRegisterDoc {
  id: string;
  document_number: string | null;
  title: string | null;
  agency: string | null;
  type: string | null;
  abstract: string | null;
  publication_date: string | null;
  federal_register_url: string | null;
}

function typeColor(type: string | null): string {
  switch (type?.toLowerCase()) {
    case "rule":
      return "bg-[#e6f9f0] text-[#0f6e56] border-[#b0e8d0]";
    case "proposed rule":
      return "bg-[#fef5e1] text-[#854f0b] border-[#fcd97e]";
    case "notice":
      return "bg-[#f0f2f5] text-[#333333] border-[#e2e4e8]";
    default:
      return "bg-[#f0f2f5] text-[#666666] border-[#e2e4e8]";
  }
}

const DEFAULT_PAGE_SIZE = 10;

export function FederalRegisterClient({
  documents,
  error,
}: {
  documents: FederalRegisterDoc[];
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.type) set.add(d.type);
    });
    return Array.from(set).sort();
  }, [documents]);

  const uniqueAgencies = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.agency) {
        d.agency.split(",").forEach((a) => set.add(a.trim()));
      }
    });
    return Array.from(set).sort();
  }, [documents]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const typeOrder: Record<string, number> = { "rule": 0, "proposed rule": 1, "notice": 2 };
    const results = documents.filter((d) => {
      if (
        q &&
        !d.title?.toLowerCase().includes(q) &&
        !d.abstract?.toLowerCase().includes(q) &&
        !d.document_number?.toLowerCase().includes(q)
      )
        return false;
      if (typeFilter !== "all" && d.type !== typeFilter) return false;
      if (agencyFilter !== "all" && !d.agency?.includes(agencyFilter))
        return false;
      return true;
    });
    results.sort((a, b) => {
      // Primary sort by type group when showing all types
      if (typeFilter === "all") {
        const aType = (a.type || "unknown").toLowerCase();
        const bType = (b.type || "unknown").toLowerCase();
        const aOrder = typeOrder[aType] ?? 99;
        const bOrder = typeOrder[bType] ?? 99;
        if (aOrder !== bOrder) return aOrder - bOrder;
      }
      // Secondary sort by most recent publication_date first
      const dateA = a.publication_date ?? "";
      const dateB = b.publication_date ?? "";
      return dateB.localeCompare(dateA);
    });
    return results;
  }, [documents, search, typeFilter, agencyFilter]);

  const typeGroups = useMemo(() => {
    if (typeFilter !== "all") return null;
    const groups: Record<string, FederalRegisterDoc[]> = {};
    const order = ["rule", "proposed rule", "notice"];
    filtered.forEach((d) => {
      const t = (d.type || "unknown").toLowerCase();
      if (!groups[t]) groups[t] = [];
      groups[t].push(d);
    });
    const remaining = Object.keys(groups).filter((t) => !order.includes(t));
    return [...order, ...remaining]
      .filter((t) => groups[t]?.length)
      .map((t) => ({ status: t, label: t.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "), items: groups[t] }));
  }, [filtered, typeFilter]);

  const handleExport = useCallback(
    (subset: FederalRegisterDoc[], filterLabel?: string) => {
      const columns = ["Date", "Title", "Agency", "Type"];
      const rows = subset.map((d) => [
        d.publication_date || "N/A",
        d.title || "Untitled",
        d.agency || "N/A",
        d.type || "N/A",
      ]);
      exportTableToPDF({
        title: "Federal Register",
        subtitle: `${subset.length} document${subset.length !== 1 ? "s" : ""}`,
        columns,
        rows,
        filters: filterLabel,
        filename: `signaic-federal-register${filterLabel ? "-" + filterLabel.toLowerCase().replace(/\s+/g, "-") : ""}.pdf`,
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
            Federal Register
          </h1>
          <p className="text-[#666666] text-sm mt-1">
            Proposed rules, final rules, and notices from FCC, FAA, NTIA, DoD, and NASA.
          </p>
        </div>
        <ExportButton
          label="Export PDF"
          options={[
            {
              label: "Export All Documents",
              onClick: () => handleExport(filtered, search ? `Search: "${search}"` : undefined),
            },
            ...uniqueTypes.map((type) => ({
              label: `Export Type: ${type}`,
              onClick: () =>
                handleExport(
                  filtered.filter((d) => d.type === type),
                  `Type: ${type}`
                ),
            })),
            ...uniqueAgencies.slice(0, 20).map((agency) => ({
              label: `Export Agency: ${agency}`,
              onClick: () =>
                handleExport(
                  filtered.filter((d) => d.agency?.includes(agency)),
                  `Agency: ${agency}`
                ),
            })),
          ]}
        />
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[#fef5e1] border border-[#fcd97e]">
          <p className="text-sm text-[#854f0b]">
            Unable to load documents. Please try again later.
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
            placeholder="Search documents..."
            className="pl-10 bg-white border-[#d1d5db] text-[#333333] placeholder:text-[#999] focus:border-[#00D4FF]"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(0);
          }}
          className="bg-white border border-[#d1d5db] text-sm text-[#333333] rounded-md px-3 py-2 focus:border-[#00D4FF] focus:outline-none appearance-none cursor-pointer"
        >
          <option value="all">All Types</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
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
                <TableHead className="text-[#666666]">Date</TableHead>
                <TableHead className="text-[#666666]">Title</TableHead>
                <TableHead className="text-[#666666]">Agency</TableHead>
                <TableHead className="text-[#666666]">Type</TableHead>
                <TableHead className="text-[#666666]">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[#666666] py-8">
                    {documents.length === 0
                      ? "Federal Register data is being collected and will appear shortly."
                      : "No documents match your filters"}
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((doc, idx) => {
                const currentType = (doc.type || "Unknown").toLowerCase();
                const prevType = idx > 0 ? (pageData[idx - 1].type || "Unknown").toLowerCase() : null;
                const showGroupHeader = typeFilter === "all" && currentType !== prevType;
                const isCollapsed = collapsedGroups[currentType];
                const typeLabel = currentType.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                const groupCount = typeGroups?.find((g) => g.status === currentType)?.items.length || 0;

                return (
                <Fragment key={doc.id}>
                  {showGroupHeader && (
                    <TableRow
                      className="bg-[#f8f9fb] hover:bg-[#f0f2f5] cursor-pointer"
                      onClick={() => setCollapsedGroups((prev) => ({ ...prev, [currentType]: !prev[currentType] }))}
                    >
                      <TableCell colSpan={5}>
                        <div className="flex items-center gap-2">
                          {isCollapsed ? <ChevronRightIcon className="w-4 h-4 text-[#666]" /> : <ChevronDown className="w-4 h-4 text-[#666]" />}
                          <span className="text-sm font-semibold text-[#333] font-[family-name:var(--font-chakra-petch)]">{typeLabel}</span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-700">{groupCount}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isCollapsed && (
                  <TableRow
                    className={`border-[#f0f0f2] hover:bg-[#fafbfc] cursor-pointer ${idx % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"}`}
                    onClick={() =>
                      setExpandedId(expandedId === doc.id ? null : doc.id)
                    }
                  >
                    <TableCell className="text-sm text-[#333333] whitespace-nowrap">
                      {doc.publication_date || "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-[#333333] max-w-md">
                      <div className="truncate" title={doc.title || ""}>
                        {doc.title || "Untitled"}
                      </div>
                      {expandedId === doc.id && doc.abstract && (
                        <p className="text-xs text-[#666666] mt-2 whitespace-normal leading-relaxed">
                          {doc.abstract}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-[#666666] max-w-[150px] truncate">
                      {doc.agency || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${typeColor(doc.type)}`}
                      >
                        {doc.type || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {doc.federal_register_url && (
                        <a
                          href={doc.federal_register_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00D4FF] hover:underline inline-flex items-center gap-1 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                  )}
                </Fragment>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#666666]">
            {filtered.length} document{filtered.length !== 1 ? "s" : ""}
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
