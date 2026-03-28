"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Building2 } from "lucide-react";

interface CompanyCard {
  id: string;
  name: string;
  type: string | null;
  sector_tags: string[];
  description: string | null;
  tracked: boolean;
}

export function EntitiesClient({ companies }: { companies: CompanyCard[] }) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return companies.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.sector_tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [companies, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-chakra-petch)] text-[#00D4FF]">
          Entities
        </h1>
        <p className="text-[#666666] text-sm mt-1">
          Tracked companies in space & defense
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies..."
          className="pl-10 bg-white border-[#d1d5db] text-[#333333]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <p className="text-[#666666] col-span-3 text-center py-8">
            No companies found
          </p>
        )}
        {filtered.map((company) => (
          <Card
            key={company.id}
            onClick={() => router.push(`/entities/${company.id}`)}
            className="bg-white border-[#f0f0f2] hover:border-[#00D4FF]/20 transition-all cursor-pointer h-full"
            style={{ borderWidth: "0.5px" }}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#00D4FF]/40" />
                <h3 className="font-medium text-[#333333]">{company.name}</h3>
              </div>
              <p className="text-xs text-[#666666] line-clamp-2">
                {company.description || "No description available."}
              </p>
              <div className="flex flex-wrap gap-1">
                {(company.sector_tags || []).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[10px] border-[#6366F1]/20 text-[#6366F1]"
                  >
                    {tag}
                  </Badge>
                ))}
                {company.type && (
                  <Badge variant="outline" className="text-[10px] border-[#e2e4e8] text-[#666666]">
                    {company.type}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
