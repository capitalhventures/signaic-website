"use client";

import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing-layout";

export default function InvestorsPage() {
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
              <span className="text-[#00D4FF]">
                Investment & Due Diligence
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
              Making investment decisions in space and defense without
              comprehensive regulatory and contract intelligence is flying blind.
              SIG/NAIC gives you the data edge.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Portfolio Company Monitoring
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Track every FCC filing, government contract award, patent
                application, and SEC disclosure for your portfolio companies in
                real time. Get alerted when something material changes before the
                broader market knows. Ask Raptor to generate on-demand portfolio
                intelligence reports for your investment committee.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Deal Sourcing Signals
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Spot emerging companies through their FCC filing patterns and
                patent activity before they hit the trade press or your inbox.
                The regulatory filings lead the headlines by months. A cluster of
                experimental licenses or a wave of patent filings signals a
                company about to make a significant move.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Comparable Analysis
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Ask Raptor to compare any two or more companies across government
                contract values, patent portfolio depth, FCC filing activity,
                orbital assets, and SEC financial metrics. Generate instant
                comparable tables and competitive analyses for investment memos,
                IC presentations, and LP reports.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
