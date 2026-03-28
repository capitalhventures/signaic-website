"use client";

import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing-layout";
import { SignaicBrand } from "@/components/signaic-brand";
import { CommandCenterPreview } from "@/components/command-center-preview";

export default function PlatformPage() {
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
              The <SignaicBrand variant="logo" /> Platform
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
              A unified command center for space and defense intelligence.
              Monitor filings, track competitors, analyze contracts, and query
              your entire dataset with an AI analyst.
            </p>
          </div>

          {/* Dashboard preview */}
          <CommandCenterPreview />

          {/* Feature sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Command Center
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Your daily intelligence briefing, automated. Live metrics
                showing tracked entities, new filings, active alerts, and
                contract values at a glance. Recent activity feed pulling from
                all data sources in real time. Filing activity charts showing
                trends over weeks and months. Customizable layout so every
                analyst sees what matters most to them first.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Ask Raptor
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                SIG/NAIC&apos;s AI-powered competitive intelligence
                analyst. Ask any question in plain English and get a structured,
                cited answer synthesized across every data source in seconds. No
                SQL. No complex dashboard filtering. Just ask.
              </p>
              <p className="text-sm text-gray-500 italic mb-3">
                For example: &ldquo;Compare Kuiper and OneWeb constellation
                parameters and their latest FCC filings.&rdquo;
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Raptor cross-references orbital data, FCC filings, patents, and
                government contracts to deliver comprehensive analysis with
                clickable source citations you can verify.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Entity Explorer
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Deep profiles for every tracked company and organization in the
                space and defense sector. See all FCC filings, government
                contracts, patents, orbital assets, and news in one unified
                view. Compare entities side-by-side across every measurable
                dimension to understand competitive positioning.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                The Orbital Brief
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                AI-generated intelligence reports customized to your sector,
                tracked companies, and mission focus. Delivered to your inbox on
                the cadence you choose: weekly, bi-weekly, or monthly. Read in 5
                minutes. Act on it all week.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
