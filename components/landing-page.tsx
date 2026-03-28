"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing-layout";
import { SignaicBrand } from "@/components/signaic-brand";
import {
  Satellite,
  Brain,
  FileText,
  Shield,
  Newspaper,
  Radio,
  Globe,
  Award,
  ScrollText,
  Briefcase,
  Lightbulb,
  FileCheck,
  Building2,
} from "lucide-react";

const dataSources = [
  { name: "FCC ECFS", icon: Radio },
  { name: "FCC ULS", icon: Radio },
  { name: "Space-Track.org", icon: Satellite },
  { name: "USPTO", icon: Lightbulb },
  { name: "USASpending.gov", icon: FileCheck },
  { name: "SEC EDGAR", icon: Building2 },
  { name: "SpaceNews", icon: Newspaper },
  { name: "SAM.gov", icon: Briefcase },
  { name: "SBIR.gov", icon: Award },
  { name: "Federal Register", icon: ScrollText },
  { name: "Defense.gov", icon: Shield },
  { name: "ITU BRIFIC", icon: Globe },
  { name: "FAA Licenses", icon: FileText },
];

export function LandingPage() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const router = useRouter();

  return (
    <MarketingLayout>
      {/* Video background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        onCanPlay={() => setVideoLoaded(true)}
        className={`fixed inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ${videoLoaded ? "opacity-100" : "opacity-0"}`}
        src="/hero-bg.mp4"
      />

      {/* Dark overlay */}
      <div
        className="fixed inset-0 z-[1]"
        style={{ background: "rgba(1, 2, 4, 0.65)" }}
      />

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-24 sm:pt-32 pb-8">
        <div className="text-center space-y-6 max-w-2xl">
          <p className="text-[11px] sm:text-xs uppercase tracking-[3px] text-[#00D4FF] font-medium">
            Competitive Intelligence for Space & Defense
          </p>

          <h1 className="text-3xl sm:text-5xl md:text-[56px] font-bold leading-tight font-[family-name:var(--font-chakra-petch)]">
            Space intelligence,{" "}
            <span className="text-[#00D4FF]">delivered.</span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            <SignaicBrand variant="inline" /> monitors FCC filings, orbital data, defense
            contracts, patents, and SEC disclosures so you don&apos;t have to.
            One platform. Every signal that matters.
          </p>

          <div className="flex flex-col items-center justify-center pt-2 gap-3">
            <button
              className="bg-[#00D4FF] text-black hover:bg-[#00B8E0] h-12 px-8 text-base font-bold rounded-lg transition-colors cursor-pointer w-72"
              onClick={() => {
                window.location.href =
                  "mailto:ryan@capitalh.io?subject=Signaic%20Demo%20Request";
              }}
            >
              Request A Demo
            </button>
            <button
              className="h-12 px-8 text-base font-bold rounded-lg transition-colors cursor-pointer w-72 border border-[#00D4FF] text-[#00D4FF] bg-transparent hover:bg-[#00D4FF]/10"
              onClick={() => router.push("/orbital-brief")}
            >
              Subscribe to The Orbital Brief
            </button>
          </div>
        </div>
      </div>

      {/* Value props */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          <div className="flex flex-col gap-3 text-center md:text-left">
            <div className="flex justify-center md:justify-start">
              <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#00D4FF]" />
              </div>
            </div>
            <h3 className="text-lg font-semibold font-[family-name:var(--font-chakra-petch)]">
              Automated Intelligence Briefs
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Weekly Orbital Briefs delivered to your inbox. Customized by
              sector, company, and the signals that matter to your mission.
            </p>
            <button
              className="mt-auto text-[#00D4FF] text-[14px] hover:underline cursor-pointer text-center md:text-left"
              onClick={() => router.push("/orbital-brief")}
            >
              Learn more →
            </button>
          </div>

          <div className="flex flex-col gap-3 text-center md:text-left">
            <div className="flex justify-center md:justify-start">
              <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-[#00D4FF]" />
              </div>
            </div>
            <h3 className="text-lg font-semibold font-[family-name:var(--font-chakra-petch)]">
              AI Analyst On Demand
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Ask questions in plain English. Raptor, our AI analyst, synthesizes
              data across every source and delivers cited, actionable answers in
              seconds.
            </p>
            <button
              className="mt-auto text-[#00D4FF] text-[14px] hover:underline cursor-pointer text-center md:text-left"
              onClick={() => router.push("/ask-raptor")}
            >
              Learn more →
            </button>
          </div>

          <div className="flex flex-col gap-3 text-center md:text-left">
            <div className="flex justify-center md:justify-start">
              <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center">
                <Satellite className="w-5 h-5 text-[#00D4FF]" />
              </div>
            </div>
            <h3 className="text-lg font-semibold font-[family-name:var(--font-chakra-petch)]">
              30+ Authoritative Data Sources
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              FCC filings, USPTO patents, USAspending contracts, SEC filings,
              Space-Track orbital data, and real-time news — all in one platform.
            </p>
            <button
              className="mt-auto text-[#00D4FF] text-[14px] hover:underline cursor-pointer text-center md:text-left"
              onClick={() => router.push("/data-sources")}
            >
              Learn more →
            </button>
          </div>
        </div>
      </div>

      {/* Ask Raptor Showcase */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-16 sm:pb-24">
        <div
          className="rounded-2xl p-8 md:p-12"
          style={{
            background: "linear-gradient(135deg, rgba(10, 22, 40, 0.95), rgba(6, 10, 20, 0.95))",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12">
            {/* Left side (3/5) */}
            <div className="md:col-span-3 space-y-6">
              <p className="text-[11px] uppercase tracking-[3px] text-[#00D4FF] font-medium">
                Meet Your AI Analyst
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-chakra-petch)] leading-tight">
                Ask Raptor anything about space &amp; defense
              </h2>

              {/* Mock prompt */}
              <div
                className="rounded-lg p-4"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <p className="text-sm text-gray-300 italic">
                  &quot;Cross-reference SpaceX&apos;s recent experimental STAs with their patent filings. What spectrum strategy shift do you see?&quot;
                </p>
              </div>

              {/* Mock response */}
              <div className="space-y-3">
                <p className="text-sm text-gray-400 leading-relaxed">
                  SpaceX filed 3 experimental STAs in Q4 2025 targeting V-band frequencies (37.5&ndash;42 GHz), a departure from their traditional Ku/Ka-band operations. Cross-referencing with USPTO data reveals 2 patent applications covering inter-satellite optical mesh routing and dynamic spectrum sharing for non-geostationary systems...
                </p>

                {/* Source citation chips */}
                <div className="flex flex-wrap gap-2">
                  {["FCC STA-0847291", "USPTO 18/291,445", "FCC IBFS SAT-LOA-2025", "SpaceX 10-Q"].map((source) => (
                    <span
                      key={source}
                      className="text-[11px] px-2.5 py-1 rounded-full font-mono"
                      style={{
                        background: "rgba(0,212,255,0.08)",
                        color: "rgba(0,212,255,0.7)",
                        border: "1px solid rgba(0,212,255,0.15)",
                      }}
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right side (2/5) */}
            <div className="md:col-span-2 flex flex-col justify-center space-y-6">
              <button
                className="w-full h-12 rounded-lg text-base font-bold transition-colors cursor-pointer border border-[#00D4FF] text-[#00D4FF] bg-transparent hover:bg-[#00D4FF]/10"
                onClick={() => router.push("/ask-raptor")}
              >
                See What Raptor Can Do →
              </button>

              <div className="space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Example prompts
                </p>
                {[
                  "Cross-reference L3Harris patent filings with their recent SBIR awards. Are they building toward a specific orbital servicing capability?",
                  "Which satellite operators filed the most FCC experimental STAs in the last 90 days, and how do their spectrum requests overlap with existing Ku/Ka allocations?",
                  "Analyze the contract award patterns between Space Force and commercial launch providers over the last 2 years. Who is gaining share?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    className="block w-full text-left text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg transition-colors cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    onClick={() => router.push("/ask-raptor")}
                  >
                    &quot;{prompt}&quot;
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data sources strip */}
      <div className="relative z-10 border-t border-white/5 bg-[#010204]/80">
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <p className="text-sm sm:text-base uppercase tracking-[3px] text-[#00D4FF] font-semibold mb-6 font-[family-name:var(--font-chakra-petch)]">
            Powered by Real-Time Data From
          </p>
          <div className="relative overflow-hidden">
            <style>{`
              @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `}</style>
            <div
              className="flex items-center gap-8 whitespace-nowrap"
              style={{ animation: "marquee 30s linear infinite", width: "max-content" }}
            >
              {[...dataSources, ...dataSources].map((source, i) => {
                const Icon = source.icon;
                return (
                  <div
                    key={`${source.name}-${i}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{
                      background: "rgba(0,212,255,0.06)",
                      border: "1px solid rgba(0,212,255,0.12)",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 text-[#00D4FF]/70 shrink-0" />
                    <span className="text-xs text-gray-400 font-mono font-medium">
                      {source.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
