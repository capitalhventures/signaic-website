"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { SignaicLogo } from "@/components/signaic-logo";
import { SignaicBrand } from "@/components/signaic-brand";
import { Menu, X } from "lucide-react";

interface DropdownItem {
  title: React.ReactNode;
  description: string;
  path: string;
}

const platformItems: DropdownItem[] = [
  {
    title: (
      <>
        The <SignaicBrand variant="logo" /> Platform
      </>
    ),
    description:
      "Unified command center for space and defense competitive intelligence. Real-time dashboard, automated alerts, entity tracking, and integrated data feeds from 7+ government sources.",
    path: "/platform",
  },
  {
    title: "Ask Raptor",
    description:
      "Your AI-powered competitive intelligence analyst. Ask any question in plain English across every data source. Get structured, cited answers synthesized from filings, contracts, patents, and more in seconds.",
    path: "/ask-raptor",
  },
  {
    title: "Data Sources",
    description:
      "7+ authoritative government and industry data feeds including FCC, USPTO, USASpending, SEC EDGAR, Space-Track, and real-time news. All aggregated, searchable, and AI-queryable.",
    path: "/data-sources",
  },
];

const solutionsItems: DropdownItem[] = [
  {
    title: "Intelligence Analysts",
    description:
      "Automated signal monitoring across FCC filings, patents, contracts, and orbital data. Replace hours of manual government database research with instant cross-source analysis.",
    path: "/solutions/intelligence-analysts",
  },
  {
    title: "Corporate Strategy & M&A",
    description:
      "Due diligence, competitive positioning, and market entry analysis powered by real regulatory and financial data. Comprehensive target assessments in hours, not weeks.",
    path: "/solutions/corporate-strategy",
  },
  {
    title: "Defense Contractors",
    description:
      "Track competitor filings, monitor contract awards across DoD, NASA, and Space Force, and identify spectrum and orbital opportunities before RFPs drop.",
    path: "/solutions/defense-contractors",
  },
  {
    title: "Investment & Due Diligence",
    description:
      "Evaluate space and defense companies with comprehensive filing histories, contract portfolios, patent depth, orbital assets, and SEC financial disclosures.",
    path: "/solutions/investors",
  },
];

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const platformTimeout = useRef<NodeJS.Timeout | null>(null);
  const solutionsTimeout = useRef<NodeJS.Timeout | null>(null);

  const handlePlatformEnter = useCallback(() => {
    if (platformTimeout.current) clearTimeout(platformTimeout.current);
    setPlatformOpen(true);
  }, []);

  const handlePlatformLeave = useCallback(() => {
    platformTimeout.current = setTimeout(() => setPlatformOpen(false), 150);
  }, []);

  const handleSolutionsEnter = useCallback(() => {
    if (solutionsTimeout.current) clearTimeout(solutionsTimeout.current);
    setSolutionsOpen(true);
  }, []);

  const handleSolutionsLeave = useCallback(() => {
    solutionsTimeout.current = setTimeout(() => setSolutionsOpen(false), 150);
  }, []);

  const navigateTo = useCallback(
    (path: string) => {
      setMobileMenuOpen(false);
      setPlatformOpen(false);
      setSolutionsOpen(false);
      router.push(path);
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-[#010204] text-white flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#010204]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => navigateTo("/")}
          >
            <SignaicLogo size="sm" showTagline={false} />
          </div>

          {/* Desktop nav items */}
          <div className="hidden md:flex items-center gap-8">
            {/* Platform Overview dropdown */}
            <div
              className="relative"
              onMouseEnter={handlePlatformEnter}
              onMouseLeave={handlePlatformLeave}
            >
              <span className="text-sm text-gray-300 hover:text-white cursor-pointer flex items-center gap-1 transition-colors">
                Platform Overview
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 transition-all duration-200 ${
                  platformOpen
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                <div
                  className="w-[400px] rounded-xl p-2.5"
                  style={{
                    background: "rgba(10, 10, 26, 0.97)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid #1a1a2e",
                  }}
                >
                  {platformItems.map((item, i) => (
                    <div
                      key={i}
                      className="px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => navigateTo(item.path)}
                    >
                      <div className="text-sm font-medium text-white">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* The Orbital Brief */}
            <span
              className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors"
              onClick={() => navigateTo("/orbital-brief")}
            >
              The Orbital Brief
            </span>

            {/* Solutions dropdown */}
            <div
              className="relative"
              onMouseEnter={handleSolutionsEnter}
              onMouseLeave={handleSolutionsLeave}
            >
              <span className="text-sm text-gray-300 hover:text-white cursor-pointer flex items-center gap-1 transition-colors">
                Solutions
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 transition-all duration-200 ${
                  solutionsOpen
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                <div
                  className="w-[400px] rounded-xl p-2.5"
                  style={{
                    background: "rgba(10, 10, 26, 0.97)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid #1a1a2e",
                  }}
                >
                  {solutionsItems.map((item, i) => (
                    <div
                      key={i}
                      className="px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => navigateTo(item.path)}
                    >
                      <div className="text-sm font-medium text-white">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {item.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* About */}
            <span
              className="text-sm text-gray-300 hover:text-white cursor-pointer transition-colors"
              onClick={() => navigateTo("/about")}
            >
              About
            </span>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              className="text-sm text-[#ccc] px-4 py-2 rounded-lg border border-[#333] hover:border-gray-500 hover:text-white transition-colors cursor-pointer"
              onClick={() => navigateTo("/login")}
            >
              Login
            </button>
            <button
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#00D4FF] text-[#010204] hover:bg-[#00B8E0] transition-colors cursor-pointer"
              onClick={() => {
                window.location.href =
                  "mailto:ryan@capitalh.io?subject=Signaic%20Demo%20Request";
              }}
            >
              Request A Demo
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-gray-300 hover:text-white cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#010204]/95 backdrop-blur-md px-6 py-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Platform
              </p>
              {platformItems.map((item, i) => (
                <div
                  key={i}
                  className="py-2 cursor-pointer"
                  onClick={() => navigateTo(item.path)}
                >
                  <div className="text-sm text-white">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div
                className="py-2 cursor-pointer"
                onClick={() => navigateTo("/orbital-brief")}
              >
                <span className="text-sm text-white">The Orbital Brief</span>
              </div>
            </div>
            <div className="space-y-1 pt-2 border-t border-white/5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Solutions
              </p>
              {solutionsItems.map((item, i) => (
                <div
                  key={i}
                  className="py-2 cursor-pointer"
                  onClick={() => navigateTo(item.path)}
                >
                  <div className="text-sm text-white">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div
                className="py-2 cursor-pointer"
                onClick={() => navigateTo("/about")}
              >
                <span className="text-sm text-white">About</span>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/5">
              <button
                className="w-full text-sm text-[#ccc] px-4 py-2 rounded-lg border border-[#333] cursor-pointer"
                onClick={() => navigateTo("/login")}
              >
                Login
              </button>
              <button
                className="w-full text-sm font-semibold px-4 py-2 rounded-lg bg-[#00D4FF] text-[#010204] cursor-pointer"
                onClick={() => {
                  window.location.href =
                    "mailto:ryan@capitalh.io?subject=Signaic%20Demo%20Request";
                }}
              >
                Request A Demo
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center">
        <p className="text-xs text-gray-600">
          <SignaicBrand /> is a Capital H Ventures LLC company
        </p>
      </footer>
    </div>
  );
}
