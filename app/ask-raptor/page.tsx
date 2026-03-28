"use client";

import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing-layout";
import { AskRaptorPreview } from "@/components/ask-raptor-preview";

export default function AskRaptorPage() {
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
              Ask <span className="text-[#00D4FF]">Raptor</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
              Your AI-powered competitive intelligence analyst for the space and
              defense sector. Ask questions in plain English. Get cited,
              actionable answers from across every data source in seconds.
            </p>
          </div>

          {/* Chat interface preview */}
          <AskRaptorPreview />

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Natural Language Queries
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                No SQL. No complex filters. No learning curve. Just ask.
              </p>
              <p className="text-sm text-gray-500 italic mb-1">
                &ldquo;Which defense primes won the most Space Force contracts
                this year?&rdquo;
              </p>
              <p className="text-sm text-gray-500 italic mb-1">
                &ldquo;Compare SpaceX and Leo FCC filing activity over the
                last 12 months.&rdquo;
              </p>
              <p className="text-sm text-gray-500 italic mb-3">
                &ldquo;What spectrum bands are most contested at the ITU right
                now?&rdquo;
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Raptor understands context, synthesizes across all data sources,
                and delivers structured analysis with section headings, key
                findings, and detailed citations.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Every Answer Is Cited
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Raptor links every claim to its source data. Click any citation
                to verify against the original FCC filing, contract record,
                patent document, or SEC disclosure. Full transparency. Full
                traceability. Your analysts can independently fact-check every
                conclusion Raptor delivers.
              </p>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                Cross-Source Synthesis
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                The real power of Raptor is connecting dots across data sources
                that no single government database can show you. A
                company&apos;s FCC filing activity correlated with their contract
                wins and patent strategy reveals competitive moves months before
                they hit the press. Raptor does this synthesis automatically on
                every query.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
