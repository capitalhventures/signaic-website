"use client";

import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing-layout";

const tiers = [
  {
    id: "weekly" as const,
    name: "Weekly Intel",
    featured: true,
    price: "$499",
    features: [
      "Monday Morning Delivery",
      "Full Week Analysis And Trends",
      "Custom Sector And Company Focus",
      "Up To 3 Recipient Email Addresses",
      "Clickable Source Citations In Every Brief",
    ],
  },
  {
    id: "biweekly" as const,
    name: "Bi-Weekly Deep Dive",
    featured: false,
    price: "$399",
    features: [
      "Every Other Monday Delivery",
      "Extended Two-Week Analysis And Outlook",
      "Custom Sector And Company Focus",
      "Up To 3 Recipient Email Addresses",
      "Clickable Source Citations In Every Brief",
    ],
  },
  {
    id: "monthly" as const,
    name: "Monthly Strategic",
    featured: false,
    price: "$349",
    features: [
      "1st Business Day Of The Month",
      "30-Day Strategic Overview And Forecasts",
      "Custom Sector And Company Focus",
      "Up To 3 Recipient Email Addresses",
      "Quarterly Trend Outlook Included",
      "Clickable Source Citations In Every Brief",
    ],
  },
];

const valueProps = [
  {
    title: "Replace Manual Research",
    description:
      "Your analysts spend 10+ hours per week scraping government databases, cross-referencing filings, and assembling briefings. The Orbital Brief does it automatically with AI that reads, synthesizes, and cites every source. Get that time back.",
  },
  {
    title: "Never Miss A Signal",
    description:
      "An FCC filing at 4:47pm on a Friday. A contract award buried in a USASpending data dump. A patent that signals a competitor\u2019s next move. The Orbital Brief catches what humans miss because it monitors every source, every day, without fatigue.",
  },
  {
    title: "Actionable, Not Informational",
    description:
      "This is not a news digest. Every Orbital Brief includes cited analysis, competitive implications, and recommended watch items. Your team reads it in 5 minutes and knows exactly what changed, what it means, and what to do about it.",
  },
];

const howItWorksSteps = [
  "Choose your cadence and sector focus",
  "Tell us which companies matter most",
  "Our AI monitors all sources continuously",
  "Raptor generates your cited brief",
  "Delivered to your inbox, ready to act on",
];

export default function OrbitalBriefPage() {
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
            <p className="text-xs uppercase tracking-[3px] text-[#00D4FF] font-medium mb-4">
              Intelligence On Autopilot
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold font-[family-name:var(--font-chakra-petch)] mb-4">
              The Orbital <span className="text-[#00D4FF]">Brief</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
              AI-generated competitive intelligence reports delivered to your
              inbox. Customized to your sector, companies, and cadence. No login
              required. No demo needed. Just signal.
            </p>
          </div>

          {/* Why The Orbital Brief */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-[#00D4FF] text-center mb-8 font-[family-name:var(--font-chakra-petch)]">
              Why The Orbital Brief
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {valueProps.map((prop) => (
                <div
                  key={prop.title}
                  className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-3 font-[family-name:var(--font-chakra-petch)]">
                    {prop.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {prop.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {tiers.map((tier) => (
              <div key={tier.id} className="pt-4 flex flex-col">
                <div
                  className={`relative rounded-xl p-8 flex flex-col flex-1 ${
                    tier.featured
                      ? "border-2 border-[#00D4FF]"
                      : "border border-white/10"
                  } bg-[#0A0A1A]`}
                >
                  {tier.featured && (
                    <span
                      className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10"
                      style={{
                        background: "#00D4FF",
                        color: "#010204",
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "4px 14px",
                        borderRadius: "20px",
                      }}
                    >
                      Best Value
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-white mb-4 font-[family-name:var(--font-chakra-petch)]">
                    {tier.name}
                  </h3>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-[#00D4FF]">
                      {tier.price}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">/month</span>
                  </div>
                  <ul className="space-y-3 mb-6 flex-1">
                    {tier.features.map((feature, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-400 flex items-start gap-2"
                      >
                        <span className="text-[#00D4FF] mt-0.5 shrink-0">
                          &#10003;
                        </span>
                        <span>
                          {feature}
                          {feature === "Up To 3 Recipient Email Addresses" && (
                            <span className="block text-xs text-gray-600 mt-0.5">
                              +$25/month per additional recipient
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer border border-[#00D4FF] text-[#00D4FF] hover:bg-[#00D4FF]/10 mt-auto"
                    onClick={() =>
                      router.push(`/orbital-brief/signup?tier=${tier.id}`)
                    }
                  >
                    Get Started
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* How It Works */}
          <div className="max-w-[900px] mx-auto mb-16">
            <h2
              className="text-center font-bold text-[#00D4FF] mb-8 font-[family-name:var(--font-chakra-petch)]"
              style={{ fontSize: "20px" }}
            >
              How It Works
            </h2>
            {/* Desktop: horizontal stepper */}
            <div className="hidden md:flex items-start justify-center">
              {howItWorksSteps.map((step, i) => (
                <div key={i} className="flex items-start">
                  <div className="flex flex-col items-center" style={{ width: "160px" }}>
                    <div
                      className="flex items-center justify-center rounded-full shrink-0"
                      style={{
                        width: "48px",
                        height: "48px",
                        background: "#00D4FF",
                        color: "#010204",
                        fontWeight: 700,
                        fontSize: "16px",
                      }}
                    >
                      {i + 1}
                    </div>
                    <p
                      className="text-center text-white mt-3"
                      style={{ fontSize: "13px", maxWidth: "160px" }}
                    >
                      {step}
                    </p>
                  </div>
                  {i < howItWorksSteps.length - 1 && (
                    <div
                      className="mt-[23px] shrink-0"
                      style={{
                        width: "32px",
                        height: "2px",
                        background: "#333",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            {/* Mobile: vertical stepper */}
            <div className="flex md:hidden flex-col items-center gap-0">
              {howItWorksSteps.map((step, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "#00D4FF",
                      color: "#010204",
                      fontWeight: 700,
                      fontSize: "16px",
                    }}
                  >
                    {i + 1}
                  </div>
                  <p
                    className="text-center text-white mt-2 mb-2"
                    style={{ fontSize: "13px", maxWidth: "180px" }}
                  >
                    {step}
                  </p>
                  {i < howItWorksSteps.length - 1 && (
                    <div
                      style={{
                        width: "2px",
                        height: "24px",
                        background: "#333",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
