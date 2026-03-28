"use client";

import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing-layout";

export default function DataSourcesPage() {
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
              Data <span className="text-[#00D4FF]">Sources</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
              SIG/NAIC aggregates 7+ authoritative data feeds into a
              single searchable, AI-queryable platform. All data is real, sourced
              directly from government and industry APIs, and refreshed
              continuously.
            </p>
          </div>

          {/* Data source cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                FCC ECFS / IBFS
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Federal Communications Commission satellite applications,
                modifications, special temporary authorities, and experimental
                licenses. Track what your competitors file with the FCC before
                they make any public announcement. Includes application details,
                grant dates, technical parameters, and full applicant
                information.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                USASpending.gov
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Federal contract awards across the Department of Defense, NASA,
                Space Force, DARPA, and all government agencies. Track contract
                values, prime contractors, subcontractors, award dates, and
                contract durations. See exactly who is winning government
                business in space and defense and how much they are being paid.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                USPTO PatentsView
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                United States Patent and Trademark Office data covering
                satellite communications, ground systems, spectrum technology,
                antenna design, and orbital mechanics patents. Understand where
                companies are investing their R&D dollars, identify emerging
                technology trends, and monitor competitor innovation strategies.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                SEC EDGAR
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Securities and Exchange Commission filings including 10-K annual
                reports, 10-Q quarterly reports, and 8-K material event
                disclosures for all public space and defense companies. Financial
                health indicators, strategic signals, executive commentary, and
                risk factor analysis.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Space-Track.org
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                NORAD catalog objects, two-line element sets, orbital parameters,
                and constellation tracking from the 18th Space Defense Squadron.
                Monitor physical assets in orbit, track new launches, analyze
                conjunction risks, and compare constellation build-out progress
                across operators.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Industry News
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Real-time coverage from SpaceNews, Via Satellite, Defense One,
                Reuters, and Bloomberg space and defense beats. Market context,
                executive moves, partnership announcements, M&A activity, and
                regulatory developments aggregated and searchable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
