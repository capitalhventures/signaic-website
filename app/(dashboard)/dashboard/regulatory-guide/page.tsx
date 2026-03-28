"use client";

import { useState } from "react";
import { Badge, SearchInput } from "@/components/ui";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Globe2, BookOpen, ExternalLink, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import regulatoryJson from "@/lib/data/regulatory-data.json";

interface RegulatorySource {
  label: string;
  url: string;
}

interface RegulatoryEntry {
  country: string;
  region: string;
  regulator_name: string;
  regulator_url: string;
  regulator_contact_url: string;
  foreign_ownership_restrictions: string;
  data_sovereignty: string;
  spectrum_licensing: string;
  landing_rights: string;
  itu_recognition: boolean;
  estimated_approval_timeline: string;
  application_portal_url: string;
  key_requirements: string[];
  telecom_services_requirements: {
    terrestrial: string;
    non_terrestrial: string;
    interconnection: string;
  };
  last_updated: string;
  sources: RegulatorySource[];
}

const regulatoryData: RegulatoryEntry[] = regulatoryJson as RegulatoryEntry[];

const countryCodeMap: Record<string, string> = {
  "United States": "US", "United Kingdom": "GB", "Canada": "CA", "Germany": "DE",
  "France": "FR", "Italy": "IT", "Spain": "ES", "Netherlands": "NL", "Sweden": "SE",
  "Norway": "NO", "UAE": "AE", "Saudi Arabia": "SA", "India": "IN", "Japan": "JP",
  "South Korea": "KR", "Australia": "AU", "Brazil": "BR", "Morocco": "MA",
  "Nigeria": "NG", "South Africa": "ZA", "Singapore": "SG", "Indonesia": "ID",
  "Mexico": "MX", "Israel": "IL", "Turkey": "TR", "Colombia": "CO", "Chile": "CL",
  "Argentina": "AR", "Peru": "PE", "Egypt": "EG", "Kenya": "KE", "Ghana": "GH",
  "Ethiopia": "ET", "Tanzania": "TZ", "Philippines": "PH", "Vietnam": "VN",
  "Thailand": "TH", "Malaysia": "MY", "Bangladesh": "BD", "Pakistan": "PK",
  "Poland": "PL", "Romania": "RO", "Czech Republic": "CZ", "Greece": "GR",
  "Portugal": "PT", "Ireland": "IE", "New Zealand": "NZ", "Qatar": "QA",
  "Kuwait": "KW", "Bahrain": "BH",
};

const regions = ["All", "Americas", "Europe", "Asia-Pacific", "Middle East", "Africa"];

export default function RegulatoryGuidePage() {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");

  const filtered = regulatoryData.filter((entry) => {
    const matchesSearch =
      !search ||
      entry.country.toLowerCase().includes(search.toLowerCase()) ||
      entry.regulator_name.toLowerCase().includes(search.toLowerCase());
    const matchesRegion =
      regionFilter === "All" || entry.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Globe2 className="w-6 h-6 text-brand-cyan" />
          Regulatory Guide
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Space and telecommunications regulatory reference across{" "}
          {regulatoryData.length} jurisdictions.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <SearchInput
          placeholder="Search by country or regulator..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-2 flex-wrap">
          {regions.map((region) => (
            <button
              key={region}
              onClick={() => setRegionFilter(region)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium border transition-colors",
                regionFilter === region
                  ? "bg-brand-cyan text-white border-brand-cyan"
                  : "bg-white text-slate-600 border-slate-300 hover:border-brand-cyan/50"
              )}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Country Count */}
      <div className="flex items-center gap-2">
        <Badge variant="cyan">
          {filtered.length} {filtered.length === 1 ? "country" : "countries"}
        </Badge>
      </div>

      {/* Regulatory Entries */}
      <div className="space-y-3">
        {filtered.map((entry) => (
          <CollapsibleCard
            key={entry.country}
            title={
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFlagEmoji(countryCodeMap[entry.country] || "")}</span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {entry.country}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {entry.regulator_name}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {entry.itu_recognition && (
                    <Badge variant="cyan" className="text-[10px]">
                      ITU Recognized
                    </Badge>
                  )}
                  <Badge variant="default">
                    {entry.region}
                  </Badge>
                </div>
              </div>
            }
          >
            <div className="space-y-4">
              {/* Approval Timeline */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-brand-cyan" />
                <span className="text-slate-500 font-medium">Estimated Approval:</span>
                <span className="text-slate-700">{entry.estimated_approval_timeline}</span>
              </div>

              <RegSection title="Spectrum Licensing" content={entry.spectrum_licensing} />
              <RegSection title="Landing Rights" content={entry.landing_rights} />
              <RegSection title="Foreign Ownership Restrictions" content={entry.foreign_ownership_restrictions} />
              <RegSection title="Data Sovereignty" content={entry.data_sovereignty} />

              {/* Telecom Services Requirements */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Telecom Services Requirements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-brand-cyan uppercase tracking-wider mb-1">Terrestrial</p>
                    <p className="text-xs text-slate-600">{entry.telecom_services_requirements.terrestrial}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-brand-cyan uppercase tracking-wider mb-1">Non-Terrestrial</p>
                    <p className="text-xs text-slate-600">{entry.telecom_services_requirements.non_terrestrial}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-semibold text-brand-cyan uppercase tracking-wider mb-1">Interconnection</p>
                    <p className="text-xs text-slate-600">{entry.telecom_services_requirements.interconnection}</p>
                  </div>
                </div>
              </div>

              {/* Key Requirements */}
              <div className="bg-brand-cyan/5 rounded-lg p-4 border border-brand-cyan/10">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-brand-cyan flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-brand-cyan uppercase tracking-wider mb-2">
                      Key Requirements
                    </p>
                    <ul className="space-y-1.5">
                      {entry.key_requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan flex-shrink-0 mt-0.5" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sources */}
              {entry.sources && entry.sources.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Regulatory Sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {entry.sources.map((source, i) => (
                      <button
                        key={i}
                        onClick={() => window.open(source.url, "_blank", "noopener,noreferrer")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-cyan border border-brand-cyan/20 bg-brand-cyan/5 hover:bg-brand-cyan/10 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {source.label}
                      </button>
                    ))}
                    {entry.application_portal_url && (
                      <button
                        onClick={() => window.open(entry.application_portal_url, "_blank", "noopener,noreferrer")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Application Portal
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Last updated: {new Date(entry.last_updated).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </CollapsibleCard>
        ))}
      </div>
    </div>
  );
}

function RegSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
        {title}
      </h4>
      <p className="text-sm text-slate-700">{content}</p>
    </div>
  );
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode) return "\uD83C\uDF10";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
