"use client";

import { useRouter } from "next/navigation";
import { MarketingLayout } from "@/components/marketing-layout";
import { SignaicBrand } from "@/components/signaic-brand";

function LinkedInIcon({
  active,
  onClick,
}: {
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5"
      style={{
        color: active ? "#00D4FF" : "#555",
        cursor: active ? "pointer" : "default",
      }}
      fill="currentColor"
      onClick={active ? onClick : undefined}
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function PersonPlaceholder() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-12 h-12"
      fill="none"
      stroke="#666"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 11a4 4 0 100-8 4 4 0 000 8zM4 21c0-4.418 3.582-7 8-7s8 2.582 8 7"
      />
    </svg>
  );
}

const teamMembers = [
  {
    name: "Ryan Hasty",
    title: "Founder & Chief Executive Officer",
    image: "/ryan-hasty-headshot.png",
    linkedIn: "https://www.linkedin.com/in/ryanhasty/",
  },
  {
    name: "Coming Soon",
    title: "VP Of Engineering",
    image: null,
    linkedIn: null,
  },
  {
    name: "Coming Soon",
    title: "VP Of Finance",
    image: null,
    linkedIn: null,
  },
  {
    name: "Coming Soon",
    title: "VP Of Operations",
    image: null,
    linkedIn: null,
  },
];

export default function AboutPage() {
  const router = useRouter();

  return (
    <MarketingLayout>
      <div className="pt-24 pb-16 px-6">
        <div className="max-w-[1100px] mx-auto">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-[#00D4FF] hover:underline mb-8 inline-block cursor-pointer"
          >
            &larr; Back To Home
          </button>

          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-5xl font-bold font-[family-name:var(--font-chakra-petch)] mb-6">
              About <SignaicBrand variant="logo" />
            </h1>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-3xl mx-auto">
              SIG/NAIC is an AI-native competitive intelligence platform
              built for the space and defense sector. We aggregate regulatory
              filings from the FCC, orbital data from Space-Track, defense
              contracts from USASpending, patents from the USPTO, SEC financial
              disclosures, and real-time industry news into a single platform
              powered by an AI analyst called Raptor.
            </p>
          </div>

          {/* What Signaic Delivers + Use Cases — side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h2 className="text-xl font-bold font-[family-name:var(--font-chakra-petch)] text-[#00D4FF] mb-4">
                What SIG/NAIC Delivers
              </h2>
              <ul className="space-y-2">
                {[
                  "Monitor competitor FCC filings, patent applications, and contract wins in real time",
                  "Ask Raptor to synthesize intelligence across every data source with cited, verifiable answers",
                  "Receive automated Orbital Briefs customized to your sector and tracked companies",
                  "Track entity activity across filings, contracts, patents, and orbital data in one unified view",
                  "Replace hours of manual government database research with instant AI-powered analysis",
                  "Built for intelligence analysts, corporate strategy teams, defense contractors, and investors",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                    <span className="text-[#00D4FF] mt-1 shrink-0">&#8226;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6">
              <h2 className="text-xl font-bold font-[family-name:var(--font-chakra-petch)] text-[#00D4FF] mb-4">
                Use Cases
              </h2>
              <ul className="space-y-2">
                {[
                  "A defense prime uses SIG/NAIC to monitor competitor FCC filings and identify new constellation proposals before they are publicly announced",
                  "An M&A team uses Raptor to generate comprehensive due diligence reports on acquisition targets, pulling filings, contracts, and patents in minutes instead of weeks",
                  "A satellite operator subscribes to the Weekly Orbital Brief to track spectrum coordination issues and competitor orbital slot filings across the FCC and ITU",
                  "A venture capital firm uses entity profiles to evaluate portfolio company competitive positioning against industry peers across every measurable dimension",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                    <span className="text-[#00D4FF] mt-1 shrink-0">&#8226;</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Executive Team */}
          <section className="mb-12">
            <h2 className="text-xl font-bold font-[family-name:var(--font-chakra-petch)] text-[#00D4FF] mb-6 text-center">
              SIG/NAIC&apos;s Executive Team
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6 flex flex-col items-center text-center"
                >
                  {/* Photo / Placeholder */}
                  <div
                    className="w-[120px] h-[120px] rounded-full flex items-center justify-center mb-4 overflow-hidden"
                    style={{ border: "2px solid #00D4FF" }}
                  >
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center">
                        <PersonPlaceholder />
                      </div>
                    )}
                  </div>
                  <p className="text-[15px] font-medium text-white mb-1">
                    {member.name}
                  </p>
                  <p className="text-[13px] text-gray-500 mb-3">
                    {member.title}
                  </p>
                  <LinkedInIcon
                    active={!!member.linkedIn}
                    onClick={
                      member.linkedIn
                        ? () => window.open(member.linkedIn!, "_blank")
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Strategic Advisors */}
          <section className="mb-12 text-center">
            <h2 className="text-lg font-bold font-[family-name:var(--font-chakra-petch)] text-[#00D4FF] mb-4">
              Strategic Advisors
            </h2>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                <span className="text-[#00D4FF] mr-2">&#8226;</span>
                Advisor Name — Title, Company
              </p>
              <p className="text-sm text-gray-400">
                <span className="text-[#00D4FF] mr-2">&#8226;</span>
                Advisor Name — Title, Company
              </p>
              <p className="text-sm text-gray-400">
                <span className="text-[#00D4FF] mr-2">&#8226;</span>
                Advisor Name — Title, Company
              </p>
            </div>
            <p className="text-xs text-[#555] mt-3">
              Advisory board members are listed as they are confirmed.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-8 text-center">
            <h2 className="text-xl font-bold font-[family-name:var(--font-chakra-petch)] text-[#00D4FF] mb-3">
              Contact
            </h2>
            <span
              className="text-sm text-[#999] hover:text-[#00D4FF] cursor-pointer transition-colors"
              onClick={() => {
                window.location.href = "mailto:contact@signaic.com";
              }}
            >
              contact@signaic.com
            </span>
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
}
