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
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon, ExternalLink } from "lucide-react";

import { cleanContractTitle } from "@/lib/utils/contracts";
import { ExportButton } from "@/components/export-button";
import { exportTableToPDF } from "@/lib/export-pdf";

interface ContractItem {
  id: string;
  contract_number: string | null;
  awarding_agency: string | null;
  contract_title: string | null;
  contract_value: number | null;
  period_start: string | null;
  period_end: string | null;
  contract_type: string | null;
  description: string | null;
  companies: { id: string; name: string } | null;
}

type SortField = "contract_value" | "period_start" | "period_end" | "awarding_agency" | "contractor";

function formatUSD(value: number | null): string {
  if (value == null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getContractStatus(contract: ContractItem): { label: string; color: string } {
  if (!contract.period_end) return { label: "Unknown", color: "bg-[#fce8e8] text-[#991f1f] border-[#f5bcbc]" };
  const endDate = new Date(contract.period_end);
  const now = new Date();
  const ninetyDays = new Date();
  ninetyDays.setDate(ninetyDays.getDate() + 90);

  if (endDate < now) return { label: "Expired", color: "bg-[#fce8e8] text-[#991f1f] border-[#f5bcbc]" };
  if (endDate < ninetyDays) return { label: "Expiring Soon", color: "bg-[#fef5e1] text-[#854f0b] border-[#fcd97e]" };
  return { label: "Active", color: "bg-[#e6f9f0] text-[#0f6e56] border-[#b0e8d0]" };
}

function openUSASpending(contract: ContractItem) {
  const query = encodeURIComponent(contract.contract_number || "");
  window.open(
    `https://www.usaspending.gov/search/?hash=&keyword=${query}`,
    "_blank",
    "noopener,noreferrer"
  );
}

export function ContractsClient({ contracts }: { contracts: ContractItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("period_start");
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(highlightId);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId]);

  const statusCounts = useMemo(() => {
    const q = search.toLowerCase();
    const base = contracts.filter((c) =>
      !q ||
      c.contract_title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.awarding_agency?.toLowerCase().includes(q) ||
      (c.companies as { name: string } | null)?.name?.toLowerCase().includes(q)
    );
    const counts: Record<string, number> = { all: base.length };
    base.forEach((c) => {
      const status = getContractStatus(c).label.toLowerCase();
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [contracts, search]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contracts
      .filter(
        (c) =>
          !q ||
          c.contract_title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.awarding_agency?.toLowerCase().includes(q) ||
          (c.companies as { name: string } | null)?.name?.toLowerCase().includes(q)
      )
      .filter((c) => {
        if (statusFilter === "all") return true;
        const status = getContractStatus(c);
        return status.label.toLowerCase() === statusFilter.toLowerCase();
      })
      .sort((a, b) => {
        // Primary sort by status group when showing all
        if (statusFilter === "all") {
          const statusOrder: Record<string, number> = { "active": 0, "expiring soon": 1, "expired": 2, "unknown": 3 };
          const aStatus = getContractStatus(a).label.toLowerCase();
          const bStatus = getContractStatus(b).label.toLowerCase();
          const aOrder = statusOrder[aStatus] ?? 99;
          const bOrder = statusOrder[bStatus] ?? 99;
          if (aOrder !== bOrder) return aOrder - bOrder;
        }

        let aVal: string | number = 0;
        let bVal: string | number = 0;

        switch (sortField) {
          case "contract_value":
            aVal = a.contract_value || 0;
            bVal = b.contract_value || 0;
            return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
          case "period_start":
            aVal = a.period_start || "";
            bVal = b.period_start || "";
            break;
          case "period_end":
            aVal = a.period_end || "";
            bVal = b.period_end || "";
            break;
          case "awarding_agency":
            aVal = a.awarding_agency || "";
            bVal = b.awarding_agency || "";
            break;
          case "contractor":
            aVal = (a.companies as { name: string } | null)?.name || "";
            bVal = (b.companies as { name: string } | null)?.name || "";
            break;
        }
        return sortAsc
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
  }, [contracts, search, sortField, sortAsc, statusFilter]);

  const statusGroups = useMemo(() => {
    if (statusFilter !== "all") return null;
    const groups: Record<string, ContractItem[]> = {};
    const order = ["active", "expiring soon", "expired", "unknown"];
    filtered.forEach((c) => {
      const s = getContractStatus(c).label.toLowerCase();
      if (!groups[s]) groups[s] = [];
      groups[s].push(c);
    });
    return order
      .filter((s) => groups[s]?.length)
      .map((s) => ({ status: s, label: s.charAt(0).toUpperCase() + s.slice(1), items: groups[s] }));
  }, [filtered, statusFilter]);

  const uniqueContractors = useMemo(() => {
    const names = new Set<string>();
    contracts.forEach((c) => {
      const name = (c.companies as { name: string } | null)?.name;
      if (name) names.add(name);
    });
    return Array.from(names).sort();
  }, [contracts]);

  function handleExport(statusOverride?: string, contractorFilter?: string) {
    let data = filtered;

    if (statusOverride && statusOverride !== "all") {
      data = data.filter(
        (c) => getContractStatus(c).label.toLowerCase() === statusOverride.toLowerCase()
      );
    }

    if (contractorFilter) {
      data = data.filter(
        (c) => (c.companies as { name: string } | null)?.name === contractorFilter
      );
    }

    const filterParts = [
      search ? `Search: "${search}"` : "",
      statusOverride ? `Status: ${statusOverride}` : statusFilter !== "all" ? `Status: ${statusFilter}` : "",
      contractorFilter ? `Contractor: ${contractorFilter}` : "",
    ].filter(Boolean).join(", ");

    exportTableToPDF({
      title: "Government Awards",
      subtitle: `${data.length} contract${data.length !== 1 ? "s" : ""}`,
      columns: ["Title", "Agency", "Contractor", "Value", "Start", "End", "Status"],
      rows: data.map((c) => [
        cleanContractTitle(c.contract_title, c.description) || "N/A",
        c.awarding_agency || "N/A",
        (c.companies as { name: string } | null)?.name || (c.awarding_agency ? `${c.awarding_agency} [Agency Direct]` : "Unknown"),
        formatUSD(c.contract_value),
        c.period_start || "N/A",
        c.period_end || "N/A",
        getContractStatus(c).label,
      ]),
      filters: filterParts || undefined,
      filename: `signaic-gov-awards-${new Date().toISOString().split("T")[0]}.pdf`,
    });
  }

  const totalPages = pageSize === 0 ? 1 : Math.ceil(filtered.length / pageSize);
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
            Government Awards
          </h1>
          <p className="text-[#666666] text-sm mt-1">
            Space & defense contracts from USASpending.gov
          </p>
        </div>
        <ExportButton
          label="Export PDF"
          options={[
            { label: "Export All Awards", onClick: () => handleExport() },
            { label: "Export Active Only", onClick: () => handleExport("active") },
            { label: "Export Expiring Only", onClick: () => handleExport("expiring soon") },
            { label: "Export Expired Only", onClick: () => handleExport("expired") },
            ...uniqueContractors.slice(0, 20).map((name) => ({
              label: `Export: ${name}`,
              onClick: () => handleExport(undefined, name),
            })),
          ]}
        />
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by title, agency, or contractor..."
              className="pl-10 bg-white border-[#d1d5db] text-[#333333]"
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
        <div className="flex items-center gap-1">
          {[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "expiring soon", label: "Expiring Soon" },
            { key: "expired", label: "Expired" },
          ].map(({ key, label }) => {
            const count = statusCounts[key] || 0;
            const isActive = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => { setStatusFilter(key); setPage(0); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-[#00D4FF]/20 text-[#0099BB] border border-[#00D4FF]/40 font-semibold"
                    : "text-[#666666] hover:text-[#333333] hover:bg-[#f5f6f8] border border-transparent"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <Card className="bg-white border-[#f0f0f2]" style={{ borderWidth: "0.5px" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#f0f0f2] hover:bg-transparent">
                <TableHead className="text-[#666666]">Title</TableHead>
                <TableHead className="text-[#666666] cursor-pointer" onClick={() => toggleSort("awarding_agency")}>
                  Agency {renderSortIcon("awarding_agency")}
                </TableHead>
                <TableHead className="text-[#666666] cursor-pointer" onClick={() => toggleSort("contractor")}>
                  Contractor {renderSortIcon("contractor")}
                </TableHead>
                <TableHead className="text-[#666666] cursor-pointer" onClick={() => toggleSort("contract_value")}>
                  Value {renderSortIcon("contract_value")}
                </TableHead>
                <TableHead className="text-[#666666] cursor-pointer" onClick={() => toggleSort("period_start")}>
                  Start {renderSortIcon("period_start")}
                </TableHead>
                <TableHead className="text-[#666666] cursor-pointer" onClick={() => toggleSort("period_end")}>
                  End {renderSortIcon("period_end")}
                </TableHead>
                <TableHead className="text-[#666666]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[#666666] py-8">
                    No contracts found
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((contract, idx) => {
                const status = getContractStatus(contract);
                const currentStatus = status.label.toLowerCase();
                const prevStatus = idx > 0 ? getContractStatus(pageData[idx - 1]).label.toLowerCase() : null;
                const showGroupHeader = statusFilter === "all" && currentStatus !== prevStatus;
                const isCollapsed = collapsedGroups[currentStatus];
                const statusLabel = status.label;
                const groupCount = statusGroups?.find((g) => g.status === currentStatus)?.items.length || 0;

                return (
                  <Fragment key={contract.id}>
                    {showGroupHeader && (
                      <TableRow
                        className="bg-[#f8f9fb] hover:bg-[#f0f2f5] cursor-pointer"
                        onClick={() => setCollapsedGroups((prev) => ({ ...prev, [currentStatus]: !prev[currentStatus] }))}
                      >
                        <TableCell colSpan={7}>
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
                      ref={contract.id === highlightId ? highlightRef : undefined}
                      className={`border-[#f0f0f2] cursor-pointer hover:bg-[#fafbfc] ${contract.id === highlightId ? "bg-[#e6f9ff]" : ""}`}
                      onClick={() => setExpandedId(expandedId === contract.id ? null : contract.id)}
                    >
                      <TableCell className="text-sm text-[#333333] max-w-xs truncate">
                        {cleanContractTitle(contract.contract_title, contract.description)}
                      </TableCell>
                      <TableCell className="text-sm text-[#666666]">
                        {contract.awarding_agency || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {contract.companies ? (
                          <span
                            className="text-[#00D4FF] hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/entities/${(contract.companies as { id: string }).id}`);
                            }}
                          >
                            {(contract.companies as { name: string }).name}
                          </span>
                        ) : contract.awarding_agency ? (
                          <span className="text-[#666]">
                            {contract.awarding_agency}{" "}
                            <span className="text-[#999] text-xs">[Agency Direct]</span>
                          </span>
                        ) : (
                          <span className="text-[#999] italic">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-[#0f6e56] font-mono">
                        {formatUSD(contract.contract_value)}
                      </TableCell>
                      <TableCell className="text-sm text-[#333333]">
                        {contract.period_start || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-[#333333]">
                        {contract.period_end || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {expandedId === contract.id && (
                      <TableRow className="border-[#f0f0f2]">
                        <TableCell colSpan={7} className="bg-[#fafbfc] p-4">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-[#666666]">Full Title:</span>
                                <p className="text-[#333333] mt-0.5">{cleanContractTitle(contract.contract_title, contract.description)}</p>
                              </div>
                              <div>
                                <span className="text-[#666666]">Contract Number:</span>
                                <p className="text-[#333333] font-mono mt-0.5">{contract.contract_number || "N/A"}</p>
                              </div>
                              <div>
                                <span className="text-[#666666]">Contract Type:</span>
                                <p className="text-[#333333] mt-0.5">{contract.contract_type || "N/A"}</p>
                              </div>
                              <div>
                                <span className="text-[#666666]">Value:</span>
                                <p className="text-[#0f6e56] font-mono mt-0.5">{formatUSD(contract.contract_value)}</p>
                              </div>
                            </div>
                            {contract.description && (
                              <div className="text-xs">
                                <span className="text-[#666666]">Description:</span>
                                <p className="text-[#666666] mt-0.5">{contract.description}</p>
                              </div>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openUSASpending(contract);
                              }}
                              className="border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10 text-xs"
                            >
                              <ExternalLink className="w-3 h-3 mr-1.5" />
                              View on USASpending.gov
                            </Button>
                          </div>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#666666]">
            {filtered.length} contract{filtered.length !== 1 ? "s" : ""}
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
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
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
