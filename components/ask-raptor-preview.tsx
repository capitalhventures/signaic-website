"use client";

import { SignaicBrand } from "@/components/signaic-brand";

export function AskRaptorPreview() {
  return (
    <div className="rounded-xl border border-[#1a1a2e] overflow-hidden mb-16">
      <div
        className="p-6 sm:p-8"
        style={{
          background: "#0A0A1A",
          transform: "scale(0.85)",
          transformOrigin: "top center",
        }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[11px] text-gray-600 font-mono">
            signaic.com/ask
          </span>
          <div className="w-16" />
        </div>

        {/* Chat header */}
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-white font-[family-name:var(--font-chakra-petch)]">
            <SignaicBrand variant="logo" /> &middot; Ask{" "}
            <span className="text-[#00D4FF]">Raptor</span>
          </p>
        </div>

        {/* Chat messages */}
        <div className="space-y-4 max-w-2xl mx-auto">
          {/* User message */}
          <div className="flex justify-end">
            <div
              className="rounded-xl px-4 py-3 max-w-[85%]"
              style={{
                background: "rgba(0, 212, 255, 0.12)",
                border: "1px solid rgba(0, 212, 255, 0.2)",
              }}
            >
              <p className="text-[13px] text-gray-200 leading-relaxed">
                Analyze SpaceX&apos;s FCC experimental license activity over the
                past 6 months and cross-reference it with their recent USPTO
                filings. Are there any patterns suggesting a new constellation
                deployment or spectrum strategy shift that could impact
                Kuiper&apos;s Ka-band coordination efforts?
              </p>
            </div>
          </div>

          {/* AI response */}
          <div className="flex justify-start">
            <div
              className="rounded-xl px-4 py-3 max-w-[90%]"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid #1a1a2e",
              }}
            >
              <p className="text-[13px] text-[#00D4FF] font-semibold mb-2">
                SpaceX FCC &amp; Patent Activity Analysis
              </p>
              <p className="text-[12px] text-gray-400 leading-relaxed mb-3">
                SpaceX filed 3 experimental STAs in Q4 2025 targeting V-band
                frequencies (37.5–42 GHz), a departure from their traditional
                Ku/Ka-band Starlink operations. Cross-referencing with USPTO
                data reveals 2 patent applications filed in the same period
                covering &ldquo;inter-satellite optical mesh routing&rdquo; and
                &ldquo;dynamic spectrum sharing for non-geostationary
                systems&rdquo;...
              </p>

              {/* Citation chips */}
              <div className="flex flex-wrap gap-1.5">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(0, 212, 255, 0.15)",
                    color: "#00D4FF",
                  }}
                >
                  FCC STA-0847291
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "#6366F1",
                  }}
                >
                  USPTO 18/291,445
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(0, 212, 255, 0.15)",
                    color: "#00D4FF",
                  }}
                >
                  FCC IBFS SAT-LOA-2025
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "#6366F1",
                  }}
                >
                  SpaceX 10-Q
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="mt-6 max-w-2xl mx-auto">
          <div
            className="rounded-lg px-4 py-2.5 flex items-center gap-2"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid #1a1a2e",
            }}
          >
            <span className="text-[12px] text-gray-600 flex-1">
              Ask Raptor anything...
            </span>
            <div
              className="w-6 h-6 rounded flex items-center justify-center"
              style={{ background: "rgba(0, 212, 255, 0.2)" }}
            >
              <svg
                className="w-3.5 h-3.5 text-[#00D4FF]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M12 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
