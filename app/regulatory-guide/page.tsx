"use client";

import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing-layout";

const regions = [
  { name: "United States", detail: "FCC, FAA, NTIA spectrum and orbital licensing" },
  { name: "European Union", detail: "EASA, CEPT, and member-state NRA requirements" },
  { name: "United Kingdom", detail: "Ofcom licensing, UK Space Agency authorization" },
  { name: "Japan", detail: "MIC spectrum allocation, JAXA coordination requirements" },
  { name: "India", detail: "DoT, IN-SPACe authorization, ISRO coordination" },
  { name: "Brazil", detail: "Anatel licensing, AEB space activity authorization" },
  { name: "United Arab Emirates", detail: "TRA spectrum, UAE Space Agency frameworks" },
  { name: "Australia", detail: "ACMA spectrum, Australian Space Agency licensing" },
  { name: "South Korea", detail: "MSIT spectrum allocation, KARI coordination" },
  { name: "Singapore", detail: "IMDA licensing, OSTx space activity regulation" },
];

export default function RegulatoryGuidePage() {
  const router = useRouter();

  return (
    <MarketingLayout>
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-[#00D4FF] hover:underline mb-8 inline-block cursor-pointer"
          >
            &larr; Back To Home
          </button>

          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-5xl font-bold font-[family-name:var(--font-chakra-petch)] mb-4">
              Regulatory <span className="text-[#00D4FF]">Intelligence</span> Across 50+ Global Markets
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
              Navigate the complex web of NTN and LEO licensing requirements,
              spectrum allocation rules, landing rights, and compliance frameworks
              across 50+ countries. All in one searchable, AI-queryable platform.
            </p>
          </div>

          {/* Capability cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                NTN & LEO Licensing Requirements
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Comprehensive licensing requirements for non-terrestrial network
                and low Earth orbit operations across every major market. Understand
                what authorizations you need before you file, and track regulatory
                changes that affect your existing licenses.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Spectrum Allocation Rules
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Band-by-band spectrum allocation tables, sharing frameworks, and
                coordination requirements for satellite services. Ka-band, Ku-band,
                V-band, and emerging frequency assignments mapped across
                jurisdictions with ITU coordination status.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Landing Rights & Market Access
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Country-by-country landing rights requirements for satellite
                operators seeking market access. Application procedures, processing
                timelines, reciprocity agreements, and regulatory contacts for each
                jurisdiction.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Compliance Frameworks
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Ongoing compliance obligations including reporting requirements,
                orbital debris mitigation plans, interference coordination
                procedures, and license renewal timelines. Stay compliant across
                every market you operate in.
              </p>
            </div>
          </div>

          {/* Country/region grid */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-chakra-petch)] text-center mb-8">
              Coverage Across <span className="text-[#00D4FF]">50+</span> Markets
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {regions.map((region) => (
                <div
                  key={region.name}
                  className="rounded-lg border border-[#1a1a2e] bg-[#0A0A1A] px-5 py-4"
                >
                  <div className="text-sm font-semibold text-white mb-1">
                    {region.name}
                  </div>
                  <div className="text-xs text-gray-500 leading-relaxed">
                    {region.detail}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">
              Plus 40+ additional markets across Europe, Asia-Pacific, Middle East, Africa, and Latin America.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              className="bg-[#00D4FF] text-black hover:bg-[#00B8E0] h-12 px-8 text-base font-bold rounded-lg transition-colors cursor-pointer"
              onClick={() => router.push("/login")}
            >
              Access Full Regulatory Guide
            </button>
            <p className="text-sm text-gray-500 mt-3">
              Full regulatory intelligence is available inside the SIG/NAIC platform.
            </p>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
