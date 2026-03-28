"use client";

import { useState, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { exportTableToPDF } from "@/lib/export-pdf";

interface OrbitalObject {
  id: string;
  norad_cat_id: string | null;
  object_name: string | null;
  object_type: string | null;
  orbit_type: string | null;
  launch_date: string | null;
  inclination: number | null;
  period: number | null;
  apoapsis: number | null;
  periapsis: number | null;
  current_status: string | null;
  company_id: string | null;
  companies: { id: string; name: string } | null;
}

const orbitTypes = ["All", "LEO", "MEO", "GEO", "HEO"];

const PAGE_SIZE_OPTIONS = [10, 50, 100] as const;

export function OrbitalDataClient({ objects }: { objects: OrbitalObject[] }) {
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    const result =
      filter === "All"
        ? [...objects]
        : objects.filter(
            (o) => o.orbit_type?.toUpperCase() === filter
          );

    // Sort by launch_date descending by default
    result.sort((a, b) => {
      const aVal = a.launch_date || "";
      const bVal = b.launch_date || "";
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    return result;
  }, [objects, filter, sortAsc]);

  const uniqueOperators = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach((o) => {
      const name = o.companies?.name;
      if (name) {
        counts.set(name, (counts.get(name) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name]) => name);
  }, [filtered]);

  function handleExport(operatorFilter?: string) {
    const sourceData = operatorFilter
      ? filtered.filter((o) => o.companies?.name === operatorFilter)
      : filtered;

    const columns = [
      "Object Name",
      "NORAD ID",
      "Operator",
      "Orbit",
      "Launch Date",
      "Inclination",
      "Period (min)",
      "Apogee (km)",
      "Perigee (km)",
      "Status",
    ];

    const rows = sourceData.map((o) => [
      o.object_name || "Unknown",
      o.norad_cat_id || "N/A",
      o.companies?.name || "—",
      o.orbit_type || "Unknown",
      o.launch_date || "N/A",
      o.inclination != null ? `${o.inclination.toFixed(1)}°` : "N/A",
      o.period != null ? o.period.toFixed(1) : "N/A",
      o.apoapsis != null ? o.apoapsis.toFixed(0) : "N/A",
      o.periapsis != null ? o.periapsis.toFixed(0) : "N/A",
      o.current_status || "N/A",
    ]);

    const filterLabel = [
      filter !== "All" ? `Orbit: ${filter}` : null,
      operatorFilter ? `Operator: ${operatorFilter}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    exportTableToPDF({
      title: operatorFilter
        ? `Orbital Objects — ${operatorFilter}`
        : "Orbital Objects",
      subtitle: `${sourceData.length} tracked objects`,
      columns,
      rows,
      filters: filterLabel || undefined,
      filename: operatorFilter
        ? `orbital-${operatorFilter.toLowerCase().replace(/\s+/g, "-")}.pdf`
        : "orbital-objects.pdf",
    });
  }

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
            Orbital Data
          </h1>
          <p className="text-[#666666] text-sm mt-1">
            Tracked objects from Space-Track.org
          </p>
        </div>
        <ExportButton
          label="Export PDF"
          options={[
            { label: "Export All Objects", onClick: () => handleExport() },
            ...uniqueOperators.map((name) => ({
              label: name,
              onClick: () => handleExport(name),
            })),
          ]}
        />
      </div>

      <Tabs value={filter} onValueChange={(val) => { setFilter(val); setPage(0); }}>
        <TabsList className="bg-white border border-[#f0f0f2]">
          {orbitTypes.map((t) => (
            <TabsTrigger key={t} value={t} className="data-[state=active]:bg-transparent data-[state=active]:text-[#00D4FF] data-[state=active]:border-b-2 data-[state=active]:border-[#00D4FF] data-[state=active]:shadow-none">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="bg-white border-[#f0f0f2]" style={{ borderWidth: "0.5px" }}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#f0f0f2] hover:bg-transparent">
                <TableHead className="text-[#666666]">Object Name</TableHead>
                <TableHead className="text-[#666666]">NORAD ID</TableHead>
                <TableHead className="text-[#666666]">Company</TableHead>
                <TableHead className="text-[#666666]">Orbit</TableHead>
                <TableHead
                  className="text-[#666666] cursor-pointer select-none hover:text-[#111111] transition-colors"
                  onClick={() => setSortAsc(!sortAsc)}
                >
                  Launch Date
                  {sortAsc
                    ? <ChevronUp className="w-3 h-3 inline ml-1" />
                    : <ChevronDown className="w-3 h-3 inline ml-1" />}
                </TableHead>
                <TableHead className="text-[#666666]">Inclination</TableHead>
                <TableHead className="text-[#666666]">Period</TableHead>
                <TableHead className="text-[#666666]">Apogee</TableHead>
                <TableHead className="text-[#666666]">Perigee</TableHead>
                <TableHead className="text-[#666666] w-10">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-[#666666] py-8">
                    No orbital objects found
                  </TableCell>
                </TableRow>
              )}
              {pageData.map((obj) => (
                <Fragment key={obj.id}>
                  <TableRow
                    className="border-[#f0f0f2] hover:bg-[#fafbfc] cursor-pointer"
                    onClick={() => setExpandedId(expandedId === obj.id ? null : obj.id)}
                  >
                    <TableCell className="text-sm text-[#333333]">
                      {obj.object_name || "Unknown"}
                    </TableCell>
                    <TableCell className="text-sm text-[#333333] font-mono">
                      {obj.norad_cat_id || "N/A"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {obj.companies ? (
                        <span
                          onClick={(e) => { e.stopPropagation(); router.push(`/entities/${(obj.companies as { id: string }).id}`); }}
                          className="text-[#00D4FF] hover:underline cursor-pointer"
                        >
                          {(obj.companies as { name: string }).name}
                        </span>
                      ) : (
                        <span className="text-[#666666]">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] border-[#00D4FF]/20 text-[#00D4FF]">
                        {obj.orbit_type || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[#333333]">
                      {obj.launch_date || "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-[#333333]">
                      {obj.inclination != null ? `${obj.inclination.toFixed(1)}°` : "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-[#333333]">
                      {obj.period != null ? `${obj.period.toFixed(1)} min` : "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-[#333333]">
                      {obj.apoapsis != null ? `${obj.apoapsis.toFixed(0)} km` : "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-[#333333]">
                      {obj.periapsis != null ? `${obj.periapsis.toFixed(0)} km` : "N/A"}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://www.n2yo.com/satellite/?s=${obj.norad_cat_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#00D4FF] hover:text-[#00D4FF]/80"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </TableCell>
                  </TableRow>
                  {expandedId === obj.id && (
                    <TableRow className="border-[#f0f0f2]">
                      <TableCell colSpan={10} className="bg-[#fafbfc] p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-[#666666]">Object Type:</span>
                            <p className="text-[#333333] mt-0.5">{obj.object_type || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-[#666666]">Status:</span>
                            <p className="text-[#333333] mt-0.5">{obj.current_status || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-[#666666]">Apogee:</span>
                            <p className="text-[#333333] mt-0.5">{obj.apoapsis != null ? `${obj.apoapsis.toFixed(0)} km` : "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-[#666666]">Perigee:</span>
                            <p className="text-[#333333] mt-0.5">{obj.periapsis != null ? `${obj.periapsis.toFixed(0)} km` : "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-[#666666]">Inclination:</span>
                            <p className="text-[#333333] mt-0.5">{obj.inclination != null ? `${obj.inclination.toFixed(2)}°` : "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-[#666666]">Period:</span>
                            <p className="text-[#333333] mt-0.5">{obj.period != null ? `${obj.period.toFixed(2)} min` : "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-[#666666]">Launch Date:</span>
                            <p className="text-[#333333] mt-0.5">{obj.launch_date || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-[#666666]">NORAD ID:</span>
                            <p className="text-[#333333] font-mono mt-0.5">{obj.norad_cat_id || "N/A"}</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#666666]">
            Showing {pageData.length} of {filtered.length} objects
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
