"use client";

import { useState } from "react";
import { Badge, SearchInput } from "@/components/ui";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { Globe2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegulatoryEntry {
  country: string;
  code: string;
  region: string;
  regulator: string;
  regBody: string;
  spectrum: string;
  licensing: string;
  foreignOwnership: string;
  launchRegulation: string;
  keyNotes: string;
}

const regulatoryData: RegulatoryEntry[] = [
  { country: "United States", code: "US", region: "North America", regulator: "FCC / FAA / NOAA / FTC", regBody: "Federal Communications Commission, Federal Aviation Administration", spectrum: "Coordinated through FCC with NTIA for federal spectrum. ITU filings managed by FCC.", licensing: "FCC Part 25 for satellite operations. FAA launch/reentry licenses. NOAA for remote sensing.", foreignOwnership: "Section 310 restricts foreign ownership of broadcast licenses. Satellite services have more flexibility through Team Telesat ruling.", launchRegulation: "FAA AST manages commercial launch licenses. Environmental reviews under NEPA required.", keyNotes: "Most developed regulatory framework for commercial space. ITAR/EAR export controls significantly impact international partnerships." },
  { country: "United Kingdom", code: "GB", region: "Europe", regulator: "Ofcom / UK Space Agency / CAA", regBody: "Office of Communications, UK Space Agency, Civil Aviation Authority", spectrum: "Managed by Ofcom. UK ITU filings through Ofcom.", licensing: "Space Industry Act 2018 provides framework for launch and satellite operations from UK.", foreignOwnership: "No specific foreign ownership restrictions for satellite operators.", launchRegulation: "CAA regulates spaceports and launch activities under Space Industry Act 2018.", keyNotes: "Post-Brexit, UK developing independent space regulatory framework. SaxaVord Spaceport in Shetland targeting vertical launch capability." },
  { country: "France", code: "FR", region: "Europe", regulator: "ARCEP / CNES / Arcom", regBody: "Autorité de régulation des communications électroniques, CNES", spectrum: "ARCEP manages spectrum allocation. French ITU filings coordinated through ARCEP/CNES.", licensing: "French Space Operations Act (FSOA) 2008 governs all space activities.", foreignOwnership: "EU framework allows intra-EU ownership. Extra-EU restrictions may apply.", launchRegulation: "CNES manages launch activities from French Guiana (CSG). Insurance requirements mandatory.", keyNotes: "Home to Arianespace and CSG launch facility. Strong regulatory framework with mandatory insurance and debris mitigation requirements." },
  { country: "Germany", code: "DE", region: "Europe", regulator: "BNetzA / DLR / BSI", regBody: "Federal Network Agency, German Aerospace Center", spectrum: "BNetzA manages spectrum. German ITU filings through BNetzA.", licensing: "Satellite Data Security Act (SatDSiG) governs Earth observation satellites.", foreignOwnership: "EU framework applies. Additional security screening for critical infrastructure.", launchRegulation: "No domestic launch capability. German operators use third-party launch services.", keyNotes: "Strong in Earth observation regulation. Increasing focus on space security and cyber resilience for space assets." },
  { country: "Japan", code: "JP", region: "Asia-Pacific", regulator: "MIC / JAXA / Cabinet Office", regBody: "Ministry of Internal Affairs and Communications, JAXA", spectrum: "MIC manages spectrum allocation and ITU coordination.", licensing: "Space Activities Act 2016 governs launch and satellite operations.", foreignOwnership: "Foreign Investment in Telecommunications limited. Security review for space assets.", launchRegulation: "Space Activities Act requires launch permits. JAXA provides technical oversight.", keyNotes: "Growing commercial space sector with Ispace, Astroscale, and others. Government actively promoting space industry growth." },
  { country: "India", code: "IN", region: "Asia-Pacific", regulator: "DoT / IN-SPACe / ISRO", regBody: "Department of Telecommunications, Indian National Space Promotion and Authorization Center", spectrum: "DoT manages spectrum. WPC wing handles satellite coordination.", licensing: "IN-SPACe established 2020 to authorize private space activities. New Space Policy 2023.", foreignOwnership: "100% FDI allowed in satellite manufacturing. Service provision has sector-specific caps.", launchRegulation: "IN-SPACe authorizes private launch activities. ISRO maintains technical oversight.", keyNotes: "Rapidly liberalizing space sector. New Space Policy 2023 opens market to private players. Strong cost advantage in manufacturing." },
  { country: "Australia", code: "AU", region: "Asia-Pacific", regulator: "ACMA / ASA", regBody: "Australian Communications and Media Authority, Australian Space Agency", spectrum: "ACMA manages spectrum and ITU coordination.", licensing: "Space (Launches and Returns) Act 2018 governs launch operations.", foreignOwnership: "Foreign Investment Review Board screening for critical infrastructure.", launchRegulation: "Australian Space Agency regulates launches. Multiple spaceport developments underway.", keyNotes: "Growing launch sector with Equatorial Launch Australia and Gilmour Space. Strategic location for equatorial and polar orbits." },
  { country: "South Korea", code: "KR", region: "Asia-Pacific", regulator: "MSIT / KARI / KASA", regBody: "Ministry of Science and ICT, Korea Aerospace Research Institute, Korea AeroSpace Administration", spectrum: "MSIT manages spectrum allocation.", licensing: "Space Development Promotion Act governs space activities.", foreignOwnership: "Restrictions on foreign ownership in key telecommunications sectors.", launchRegulation: "KASA (established 2024) oversees space launches. Nuri rocket provides domestic capability.", keyNotes: "KASA establishment signals growing commitment to space. Nuri rocket gives indigenous launch capability. Active in Earth observation." },
  { country: "Canada", code: "CA", region: "North America", regulator: "ISED / CSA", regBody: "Innovation, Science and Economic Development Canada, Canadian Space Agency", spectrum: "ISED manages spectrum through Spectrum Management. ITU filings through ISED.", licensing: "Remote Sensing Space Systems Act governs Earth observation. Telecom Act for satellite communications.", foreignOwnership: "Telecommunications Act limits foreign ownership to 20% direct, 33.3% indirect.", launchRegulation: "No domestic commercial launch capability. Canadian operators use third-party launch.", keyNotes: "Strong in satellite communications (Telesat, MDA). Telesat Lightspeed LEO constellation under development. Restrictive foreign ownership rules for telecom." },
  { country: "Luxembourg", code: "LU", region: "Europe", regulator: "ILR / LSA", regBody: "Institut Luxembourgeois de Régulation, Luxembourg Space Agency", spectrum: "ILR manages spectrum and satellite coordination.", licensing: "Law of July 15, 2020 on space activities.", foreignOwnership: "Open framework. Luxembourg actively courts international space companies.", launchRegulation: "No domestic launch capability.", keyNotes: "SpaceResources.lu initiative positions Luxembourg as hub for space resources. SES headquarters. Very favorable regulatory and tax environment for space companies." },
  { country: "Israel", code: "IL", region: "Middle East", regulator: "MOC / ISA", regBody: "Ministry of Communications, Israel Space Agency", spectrum: "MOC manages spectrum. Coordination with military for dual-use spectrum.", licensing: "Space Law pending. Current activities governed through various ministry regulations.", foreignOwnership: "Security restrictions on defense-related space activities.", launchRegulation: "ISA coordinates launches. Shavit launch vehicle for domestic needs.", keyNotes: "Strong in ISR and defense-focused space capabilities. Active smallsat industry. Geographic constraints on launch azimuth (over Mediterranean only)." },
  { country: "United Arab Emirates", code: "AE", region: "Middle East", regulator: "TDRA / UAE Space Agency", regBody: "Telecommunications and Digital Government Regulatory Authority, UAE Space Agency", spectrum: "TDRA manages spectrum allocation.", licensing: "National Space Policy and Federal Law No. 12 of 2019 on space sector.", foreignOwnership: "Free zone structures allow 100% foreign ownership in designated areas.", launchRegulation: "UAE Space Agency oversees space activities. No domestic launch capability yet.", keyNotes: "Ambitious space program including Mars Hope probe. Dubai and Abu Dhabi space free zones attract international companies. Growing investment in space infrastructure." },
  { country: "Singapore", code: "SG", region: "Asia-Pacific", regulator: "IMDA / OSTx", regBody: "Infocomm Media Development Authority, Office for Space Technology & Industry", spectrum: "IMDA manages spectrum and satellite coordination.", licensing: "Space sector regulated under telecommunications framework.", foreignOwnership: "Generally open to foreign investment.", launchRegulation: "No domestic launch capability. OSTx coordinates space industry development.", keyNotes: "Positioning as Asia-Pacific space hub. Growing satellite manufacturing and ground segment industry. Strategic equatorial location." },
  { country: "Brazil", code: "BR", region: "South America", regulator: "Anatel / AEB / FAB", regBody: "National Telecommunications Agency, Brazilian Space Agency, Brazilian Air Force", spectrum: "Anatel manages spectrum and ITU coordination.", licensing: "Space activities governed through multiple agencies. Reform ongoing.", foreignOwnership: "Limited foreign ownership in telecommunications. Eased for satellite operators.", launchRegulation: "Alcântara launch site near equator. Safeguards agreement with US enables commercial use.", keyNotes: "Alcântara is the world's closest major spaceport to the equator, offering significant performance advantages. Regulatory modernization ongoing." },
  { country: "New Zealand", code: "NZ", region: "Asia-Pacific", regulator: "RSM / NZSA", regBody: "Radio Spectrum Management, New Zealand Space Agency", spectrum: "RSM manages spectrum under Radio Communications Act.", licensing: "Outer Space and High-altitude Activities Act 2017.", foreignOwnership: "Overseas Investment Act review for significant assets.", launchRegulation: "NZSA licenses launches. Rocket Lab's Launch Complex 1 at Mahia Peninsula.", keyNotes: "Home to Rocket Lab's primary launch site. Progressive regulatory framework. Favorable geography for sun-synchronous orbits." },
];

const regions = ["All", "North America", "Europe", "Asia-Pacific", "Middle East", "South America"];

export default function RegulatoryGuidePage() {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");

  const filtered = regulatoryData.filter((entry) => {
    const matchesSearch =
      !search ||
      entry.country.toLowerCase().includes(search.toLowerCase()) ||
      entry.regulator.toLowerCase().includes(search.toLowerCase());
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
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by country or regulator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
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
            key={entry.code}
            title={
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFlagEmoji(entry.code)}</span>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {entry.country}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {entry.regulator}
                  </p>
                </div>
                <Badge variant="default" className="ml-auto">
                  {entry.region}
                </Badge>
              </div>
            }
          >
            <div className="space-y-4">
              <RegSection title="Regulatory Body" content={entry.regBody} />
              <RegSection title="Spectrum Management" content={entry.spectrum} />
              <RegSection title="Licensing Framework" content={entry.licensing} />
              <RegSection
                title="Foreign Ownership Rules"
                content={entry.foreignOwnership}
              />
              <RegSection title="Launch Regulation" content={entry.launchRegulation} />
              <div className="bg-brand-cyan/5 rounded-lg p-4 border border-brand-cyan/10">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-brand-cyan flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-brand-cyan uppercase tracking-wider mb-1">
                      Key Notes
                    </p>
                    <p className="text-sm text-slate-700">{entry.keyNotes}</p>
                  </div>
                </div>
              </div>
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
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
