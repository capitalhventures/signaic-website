"use client";

import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing-layout";

export default function DefenseContractorsPage() {
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
              For{" "}
              <span className="text-[#00D4FF]">Defense Contractors</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
              Track competitor filings, monitor contract awards across DoD, NASA,
              and Space Force, and identify spectrum and orbital opportunities
              before RFPs drop. Built for teams that need to move fast in a
              competitive landscape.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Competitor Filing Intelligence
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Know when Northrop Grumman files an FCC application for a new
                satellite constellation, when L3Harris patents a new ground
                terminal design, or when SpaceX wins another Space Force
                contract. Real-time monitoring across all public government data
                sources with automated alerts on the entities and topics you care
                about.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Contract Pipeline Visibility
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Track every Department of Defense, NASA, and Space Force contract
                award in real time. See who is winning, who is losing, where
                federal dollars are flowing, and which agencies are increasing or
                decreasing spend in your target areas. Identify upcoming
                re-compete opportunities before they hit SAM.gov.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Spectrum And Orbital Awareness
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Monitor spectrum allocation proceedings at the FCC and
                coordination filings at the ITU. Track orbital slot filings and
                constellation amendments from competitors. Identify spectrum
                conflicts and coordination issues before they become public
                disputes or interference complaints.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
