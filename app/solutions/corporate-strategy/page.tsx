"use client";

import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing-layout";

export default function CorporateStrategyPage() {
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
              <span className="text-[#00D4FF]">Corporate Strategy & M&A</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
              Evaluating an acquisition target or competitive threat in space or
              defense? SIG/NAIC gives you the complete picture: regulatory
              filings, government contracts, patents, orbital assets, and
              financial disclosures unified in one platform.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Due Diligence In Hours, Not Weeks
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Pull a target company&apos;s complete regulatory footprint,
                government contract history, patent portfolio, and SEC filings
                instantly through Entity Explorer. Ask Raptor to generate a
                comprehensive competitive landscape analysis on demand with full
                source citations that your team can verify independently.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Competitive Positioning
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                See exactly where a target or portfolio company sits relative to
                competitors across every measurable dimension: FCC spectrum
                holdings, government contract values and win rates, patent depth
                and technology focus areas, orbital assets, and financial
                performance. Data-driven positioning, not guesswork.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Market Entry Analysis
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Considering entering a new segment within space or defense?
                SIG/NAIC shows who is already there, what they have filed
                with regulators, what contracts they hold, what technologies they
                have patented, and where the white space exists for your entry
                strategy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
