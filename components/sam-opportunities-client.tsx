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
import { Search, ExternalLink, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, RefreshCw, Clock } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { exportTableToPDF } from "@/lib/export-pdf";
import { formatDistanceToNow } from "date-fns";

interface Opportunity {
  id: string;
  solicitation_number: string | null;
  title: string | null;
  agency: string | null;
  description: string | null;
  estimated_value: number | null;
  set_aside_type: string | null;
  response_deadline: string | null;
  place_of_performance: string | null;
  naics_code: string | null;
  psc_code: string | null;
  sam_gov_url: string | null;
  posted_date: string | null;
  opportunity_type: string | null;
}

type SortField = "posted_date" | "response_deadline" | "title" | "agency";

function deadlineColor(deadline: string | null): string {
  if (!deadline) return "bg-[#f0f2f5] text-[#666666] border-[#e2e4e8]";
  const now = new Date();
  const dl = new Date(deadline);
  const daysUntil = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntil < 0) return "bg-[#f0f2f5] text-[#666666] border-[#e2e4e8]";
  if (daysUntil < 7) return "bg-[#fce8e8] text-[#991f1f] border-[#f5bcbc]";
  if (daysUntil < 30) return "bg-[#fef5e1] text-[#854f0b] border-[#fcd97e]";
  return "bg-[#e6f9f0] text-[#0f6e56] border-[#b0e8d0]";
}

export function SamOpportunitiesClient({
  opportunities,
  error,
  isAdmin,
  lastRefreshed,
}: {
  opportunities: Opportunity[];
  error?: string;
  isAdmin?: boolean;
  lastRefreshed?: string | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [setAsideFilter, setSetAsideFilter] = useState("all");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [naicsFilter, setNaicsFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>("posted_date");
  const [sortAsc, setSortAsc] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<string | null>(null);

  const uniqueSetAsides = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      if (o.set_aside_type) set.add(o.set_aside_type);
    });
    return Array.from(set).sort();
  }, [opportunities]);

  const uniqueAgencies = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      if (o.agency) {
        const top = o.agency.split(".")[0].trim();
        set.add(top);
      }
    });
    return Array.from(set).sort();
  }, [opportunities]);

  const uniqueNaics = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      if (o.naics_code) set.add(o.naics_code);
    });
    return Array.from(set).sort();
  }, [opportunities]);

  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      if (o.opportunity_type) set.add(o.opportunity_type);
    });
    return Array.from(set).sort();
  }, [opportunities]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return opportunities
      .filter((o) => {
        if (
          q &&
          !o.title?.toLowerCase().includes(q) &&
          !o.solicitation_number?.toLowerCase().includes(q) &&
          !o.agency?.toLowerCase().includes(q) &&
          !o.description?.toLowerCase().includes(q)
        )
          return false;
        if (setAsideFilter !== "all" && o.set_aside_type !== setAsideFilter)
          return false;
        if (
          agencyFilter !== "all" &&
          !o.agency?.startsWith(agencyFilter)
        )
          return false;
        if (naicsFilter !== "all" && o.naics_code !== naicsFilter)
          return false;
        if (typeFilter !== "all" && o.opportunity_type !== typeFilter)
          return false;
        if (dateFrom && o.posted_date && o.posted_date < dateFrom)
          return false;
        if (dateTo && o.posted_date && o.posted_date > dateTo)
          return false;
        return true;
      })
      .sort((a, b) => {
        let aVal: string = "";
        let bVal: string = "";
        switch (sortField) {
          case "posted_date":
            aVal = a.posted_date || "";
            bVal = b.posted_date || "";
            break;
          case "response_deadline":
            aVal = a.response_deadline || "";
            bVal = b.response_deadline || "";
            break;
          case "title":
            aVal = a.title || "";
            bVal = b.title || "";
            break;
          case "agency":
            aVal = a.agency || "";
            bVal = b.agency || "";
            break;
        }
        return sortAsc
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
  }, [opportunities, search, setAsideFilter, agencyFilter, naicsFilter, typeFilter, dateFrom, dateTo, sortField, sortAsc]);

  const handleExport = useCallback(
    (subset: Opportunity[], filterLabel?: string) => {
      const columns = ["Title", "Agency", "Type", "Set-Aside", "Posted", "Deadline", "NAICS"];
      const rows = subset.map((o) => [
        o.title || "Untitled",
        o.agency || "N/A",
        o.opportunity_type || "N/A",
        o.set_aside_type || "Open",
        o.posted_date ? new Date(o.posted_date).toLocaleDateString() : "N/A",
        o.response_deadline ? new Date(o.response_deadline).toLocaleDateString() : "N/A",
        o.naics_code || "N/A",
      ]);
      exportTableToPDF({
        title: "SAM.gov Contract Opportunities",
        subtitle: `${subset.length} opportunit${subset.length !== 1 ? "ies" : "y"}`,
        columns,
        rows,
        filters: filterLabel,
        filename: `signaic-sam-opportunities${filterLabel ? "-" + filterLabel.toLowerCase().replace(/\s+/g, "-") : ""}.pdf`,
      });
    },
    []
  );

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const res = await fetch("/api/v1/sam/refresh", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setRefreshResult(`${json.data.inserted} new opportunities added`);
        setTimeout(() => router.refresh(), 1500);
      } else {
        setRefreshResult(json.error || "Refresh failed");
      }
    } catch {
      setRefreshResult("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  const effectivePageSize = pageSize === 0 ? filtered.length : pageSize;
  const pageCount = effectivePageSize > 0 ? Math.ceil(filtered.length / effectivePageSize) : 1;
  const pageData = pageSize === 0 ? filtered : filtered.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  }

  function renderSortIcon(field: SortField) {
    if (sortField !== field) return null;
    return sortAsc
      ? <ChevronUp className="w-3 h-3 inline ml-1" />
      : <ChevronDown className="w-3 h-3 inline ml-1" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-chakra-petch)] text-[#00D4FF]">
            Contract Opportunities
          </h1>
          <p className="text-[#666666] text-sm mt-1">
            Active opportunities from SAM.gov for space, defense, and telecom.
          </p>
          {(lastRefreshed || refreshResult) && (
            <div className="flex items-center gap-3 mt-2 text-xs text-[#888888]">
              {lastRefreshed && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last refreshed: {formatDistanceToNow(new Date(lastRefreshed), { addSuffix: true })}
                </span>
              )}
              {refreshResult && (
                <span className="text-[#06b6d4]">{refreshResult}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-[#d1d5db] text-[#666666] gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          )}
          <ExportButton
            label="Export PDF"
            options={[
              {
                label: "Export All Opportunities",
                onClick: () => handleExport(filtered, search ? `Search: "${search}"` : undefined),
              },
              ...uniqueNaics.slice(0, 15).map((code) => ({
                label: `Export NAICS: ${code}`,
                onClick: () =>
                  handleExport(
                    filtered.filter((o) => o.naics_code === code),
                    `NAICS: ${code}`
                  ),
              })),
              ...uniqueAgencies.slice(0, 15).map((agency) => ({
                label: `Export Agency: ${agency}`,
                onClick: () =>
                  handleExport(
                    filtered.filter((o) => o.agency?.startsWith(agency)),
                    `Agency: ${agency}`
                  ),
              })),
              ...uniqueSetAsides.slice(0, 10).map((sa) => ({
                label: `Export Set-Aside: ${sa}`,
                onClick: () =>
                  handleExport(
                    filtered.filter((o) => o.set_aside_type === sa),
                    `Set-Aside: ${sa}`
                  ),
              })),
            ]}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[#fef5e1] border border-[#fcd97e]">
          <p className="text-sm text-[#854f0b]">
            Unable to load opportunities. Please try again later.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search opportunities..."
              className="pl-10 bg-white border-[#d1d5db] text-[#333333] placeholder:text-[#999] focus:border-[#00D4FF]"
            />
          </div>
          <select
            value={setAsideFilter}
            onChange={(e) => {
              setSetAsideFilter(e.target.value);
              setPage(0);
            }}
            className="bg-white border border-[#d1d5db] text-sm text-[#333333] rounded-md px-3 py-2 focus:border-[#00D4FF] focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Set-Asides</option>
            {uniqueSetAsides.map((s) => (
              <option key={s} value={s}>
                {s}
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
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={naicsFilter}
            onChange={(e) => {
              setNaicsFilter(e.target.value);
              setPage(0);
            }}
            className="bg-white border border-[#d1d5db] text-sm text-[#333333] rounded-md px-3 py-2 focus:border-[#00D4FF] focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">All NAICS Codes</option>
            {uniqueNaics.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
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
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#666666] whitespace-nowrap">Posted from:</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(0);
              }}
              className="bg-white border-[#d1d5db] text-sm text-[#333333] max-w-[160px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#666666] whitespace-nowrap">to:</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(0);
              }}
              className="bg-white border-[#d1d5db] text-sm text-[#333333] max-w-[160px]"
            />
          </div>
          <select
            value={pageSize === 0 ? "all" : String(pageSize)}
            onChange={(e) => {
              const val = e.target.value;
              setPageSize(val === "all" ? 0 : Number(val));
              setPage(0);
            }}
            className="bg-white border border-[#d1d5db] text-sm text-[#333333] rounded-md px-3 py-2 focus:border-[#00D4FF] focus:outline-none appearance-none cursor-pointer"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      <Card className="bg-white border-[#e2e4e8]" style={{ borderWidth: "0.5px" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#f0f0f2]">
                <TableHead className="text-[#666666] cursor-pointer" onClick={() => toggleSort("title")}>
                  Title {renderSortIcon("title")}
                </TableHead>
                <TableHead className="text-[#666666] cursor-pointer" onClick={() => toggleSort("agency")}>
                  Agency {renderSortIcon("agency")}
                </TableHead>
                <TableHead className="text-[#666666]">Type</TableHead>
                <TableHead className="text-[#666666]">Set-Aside</TableHead>
                <TableHead className="text-[#666666] cursor-pointer" onClick={() => toggleSort("posted_date")}>
                  Posted {renderSortIcon("posted_date")}
                </TableHead>
                <TableHead className="text-[#666666] cursor-pointer" onClick={() => toggleSort("response_deadline")}>
                  Deadline {renderSortIcon("response_deadline")}
                </TableHead>
                <TableHead className="text-[#666666]">NAICS</TableHead>
                <TableHead className="text-[#666666]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-[#666666] py-8"
                  >
                    {opportunities.length === 0
                      ? "No SAM.gov opportunities loaded yet. Use the Refresh button to fetch live data."
                      : "No opportunities match your filters"}
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((opp, i) => (
                <TableRow
                  key={opp.id}
                  className={`border-[#f0f0f2] hover:bg-[#fafbfc] ${i % 2 === 1 ? "bg-[#fafbfc]" : "bg-white"}`}
                >
                  <TableCell className="text-sm text-[#333333] max-w-xs">
                    <div className="truncate" title={opp.title || ""}>
                      {opp.title || "Untitled"}
                    </div>
                    <div className="text-xs text-[#999] font-mono mt-0.5">
                      {opp.solicitation_number}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-[#666666] max-w-[150px] truncate">
                    {opp.agency || "N/A"}
                  </TableCell>
                  <TableCell className="text-xs text-[#666666]">
                    {opp.opportunity_type || "N/A"}
                  </TableCell>
                  <TableCell>
                    {opp.set_aside_type ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-[#f0f2f5] text-[#333333] border-[#e2e4e8]"
                      >
                        {opp.set_aside_type}
                      </Badge>
                    ) : (
                      <span className="text-xs text-[#999]">Open</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-[#666666]">
                    {opp.posted_date
                      ? new Date(opp.posted_date).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {opp.response_deadline ? (
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${deadlineColor(opp.response_deadline)}`}
                      >
                        {new Date(opp.response_deadline).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <span className="text-xs text-[#999]">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-[#666666] font-mono">
                    {opp.naics_code || "N/A"}
                  </TableCell>
                  <TableCell>
                    {opp.sam_gov_url && (
                      <span
                        onClick={() => window.open(opp.sam_gov_url!, "_blank")}
                        className="text-[#00D4FF] hover:underline inline-flex items-center gap-1 text-xs cursor-pointer"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
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

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#666666]">
            {filtered.length} opportunit{filtered.length !== 1 ? "ies" : "y"}
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
