"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

/* ─── SVG Logo (3x3 grid from original) ─── */
function SignaicLogo({ size = 36, id = "lg" }: { size?: number; id?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
      <rect x="1" y="1" width="8.5" height="8.5" rx="1.5" fill="#06b6d4" opacity=".9" />
      <rect x="11.75" y="1" width="8.5" height="8.5" rx="1.5" fill="#06b6d4" opacity=".4" />
      <rect x="22.5" y="1" width="8.5" height="8.5" rx="1.5" fill="#6366f1" opacity=".2" />
      <rect x="1" y="11.75" width="8.5" height="8.5" rx="1.5" fill="#06b6d4" opacity=".3" />
      <rect x="11.75" y="11.75" width="8.5" height="8.5" rx="1.5" fill={`url(#${id})`} />
      <rect x="22.5" y="11.75" width="8.5" height="8.5" rx="1.5" fill="#6366f1" opacity=".5" />
      <rect x="1" y="22.5" width="8.5" height="8.5" rx="1.5" fill="#6366f1" opacity=".15" />
      <rect x="11.75" y="22.5" width="8.5" height="8.5" rx="1.5" fill="#6366f1" opacity=".35" />
      <rect x="22.5" y="22.5" width="8.5" height="8.5" rx="1.5" fill="#6366f1" opacity=".8" />
      <defs>
        <linearGradient id={id} x1="11.75" y1="11.75" x2="20.25" y2="20.25">
          <stop stopColor="#06b6d4" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Chevron icon for dropdowns ─── */
function Chevron() {
  return (
    <svg className="chevron-icon w-3 h-3" viewBox="0 0 12 12" fill="none">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Arrow icon for CTAs ─── */
function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  );
}

/* ─── Dropdown icon wrapper ─── */
function DdIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg" style={{ background: "rgba(6,182,212,0.12)" }}>
      <svg className="w-[18px] h-[18px] text-[#06b6d4]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {children}
      </svg>
    </div>
  );
}

/* ─── Mega dropdown data ─── */
const platformItems = [
  { title: "Intelligence Briefings", desc: "Weekly AI-synthesized competitive reports", icon: <><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" /></> },
  { title: "Competitive Dashboard", desc: "Real-time monitoring across 12+ sources", icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="4" rx="1" /><rect x="14" y="10" width="7" height="11" rx="1" /><rect x="3" y="13" width="7" height="8" rx="1" /></> },
  { title: "Predictive Analytics", desc: "ML models forecasting approvals and awards", icon: <><path d="M21 21H4.6c-.56 0-.84 0-1.05-.11a1 1 0 0 1-.44-.44C3 20.24 3 19.96 3 19.4V3" /><path d="m7 14 4-4 4 4 6-6" /></> },
  { title: "Market Entry Playbooks", desc: "Country-by-country regulatory playbooks", icon: <><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></> },
  { title: "API Access", desc: "Integrate intelligence into your tools", icon: <><path d="M16 18l2-2-2-2" /><path d="M8 18l-2-2 2-2" /><path d="M7 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7" /><path d="M17 6h-2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></> },
  { title: "Custom Reporting", desc: "Board-ready reports and M&A packages", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></> },
];

const industryItems = [
  { title: "Satellite Operators", desc: "Constellation operators and service providers", icon: <><circle cx="12" cy="12" r="3" /><path d="M3 12a9 9 0 0 1 9-9" /><path d="M21 12a9 9 0 0 1-9 9" /><path d="M3.6 9h16.8" /><path d="M3.6 15h16.8" /></> },
  { title: "Defense & Aerospace", desc: "Defense primes, startups, and contractors", icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></> },
  { title: "Space Investors", desc: "VCs, PE firms, and family offices", icon: <><path d="M2 20h20" /><path d="M5 20V8l5-5 5 5v12" /><path d="M19 20V13l-4-4" /><rect x="9" y="12" width="2" height="4" /></> },
  { title: "Government & Military", desc: "Space Force, NRO, allied agencies", icon: <><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-4h6v4" /></> },
];

const aboutItems = [
  { title: "Our Story", desc: "Why we built Signaic and where we're going", icon: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></> },
  { title: "Our Approach", desc: "How we transform raw data into intelligence", icon: <><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></> },
  { title: "Data Sources", desc: "12+ public sources powering continuous intelligence", icon: <><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></> },
];

/* ─── Ticker data source items ─── */
const tickerItems = [
  { name: "FCC ICFS", icon: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /></> },
  { name: "ITU Space Explorer", icon: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /></> },
  { name: "SAM.gov", icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></> },
  { name: "USASpending", icon: <><path d="M2 20h20" /><path d="M5 20V8l5-5 5 5v12" /></> },
  { name: "Space-Track", icon: <><circle cx="12" cy="12" r="3" /><path d="M3 12a9 9 0 0 1 9-9" /><path d="M21 12a9 9 0 0 1-9 9" /></> },
  { name: "CelesTrak", icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></> },
  { name: "USPTO Patents", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /></> },
  { name: "LinkedIn", icon: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></> },
  { name: "SEC EDGAR", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M16 13H8" /><path d="M16 17H8" /></> },
  { name: "Industry RSS", icon: <><path d="M4 11a9 9 0 0 1 9 9" /><path d="M4 4a16 16 0 0 1 16 16" /><circle cx="5" cy="19" r="1" /></> },
  { name: "GitHub", icon: <><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S8.93 17.38 9 18v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></> },
  { name: "Global Regulators", icon: <><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></> },
];

/* ─── Counter hook ─── */
function useCounter(ref: React.RefObject<HTMLSpanElement | null>, target: number, suffix: string, duration = 2000) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const start = Date.now();
          const tick = () => {
            const progress = Math.min((Date.now() - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
          };
          tick();
          observer.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, target, suffix, duration]);
}

/* ─── Counter component ─── */
function AnimatedCounter({ target, suffix, prefix = "" }: { target: number; suffix: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useCounter(ref, target, suffix);
  return <>{prefix}<span ref={ref}>0{suffix}</span></>;
}

/* ─── Main Page ─── */
export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Nav scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Video fade-in
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const show = () => vid.classList.add("loaded");
    vid.addEventListener("canplaythrough", show);
    vid.addEventListener("loadeddata", show);
    if (vid.readyState >= 3) show();
    const fallback = setTimeout(show, 3000);
    return () => {
      clearTimeout(fallback);
      vid.removeEventListener("canplaythrough", show);
      vid.removeEventListener("loadeddata", show);
    };
  }, []);

  // Intersection observer for fade-in sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("visible"), i * 100);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    document.querySelectorAll(".landing-fade-in").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleMobileDropdown = useCallback((name: string, e: React.MouseEvent) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      setOpenDropdown((prev) => (prev === name ? null : name));
    }
  }, []);

  return (
    <div className="font-dm" style={{ background: "#010204", color: "#e0e4ec", lineHeight: 1.6, overflowX: "hidden" }}>
      {/* ═══ NAV ═══ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-[400ms] border-b ${
          scrolled
            ? "py-[0.6rem] border-white/[0.04]"
            : "py-4 border-transparent"
        }`}
        style={scrolled ? { background: "rgba(1,2,4,0.92)", backdropFilter: "blur(20px)" } : undefined}
      >
        <div className="max-w-[1200px] mx-auto px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 text-white font-outfit font-bold text-2xl tracking-tight whitespace-nowrap">
            <SignaicLogo size={36} id="nav-lg" />
            SIGN<span className="text-[#06b6d4]">AI</span>C
          </Link>

          {/* Desktop nav links */}
          <ul className="landing-nav-links hidden md:flex list-none gap-0 items-center">
            {/* Platform */}
            <li className="nav-item-landing relative">
              <a href="#" onClick={(e) => toggleMobileDropdown("platform", e)} className="flex items-center gap-1 px-4 py-2 font-outfit text-[0.9rem] font-medium text-[#7a859c] hover:text-white transition-colors">
                Platform <Chevron />
              </a>
              <div className={`mega-dropdown ${openDropdown === "platform" ? "open" : ""}`}>
                <div className="grid grid-cols-2 gap-1">
                  {platformItems.map((item) => (
                    <a key={item.title} href="#" className="flex items-start gap-3 p-3 rounded-[10px] hover:bg-white/[0.04] transition-colors">
                      <DdIcon>{item.icon}</DdIcon>
                      <div>
                        <h4 className="font-outfit text-[0.88rem] font-semibold text-white mb-0.5">{item.title}</h4>
                        <p className="text-[0.78rem] text-[#7a859c] leading-snug">{item.desc}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </li>

            {/* Industries */}
            <li className="nav-item-landing relative">
              <a href="#" onClick={(e) => toggleMobileDropdown("industries", e)} className="flex items-center gap-1 px-4 py-2 font-outfit text-[0.9rem] font-medium text-[#7a859c] hover:text-white transition-colors">
                Industries <Chevron />
              </a>
              <div className={`mega-dropdown ${openDropdown === "industries" ? "open" : ""}`}>
                <div className="grid grid-cols-2 gap-1">
                  {industryItems.map((item) => (
                    <a key={item.title} href="#" className="flex items-start gap-3 p-3 rounded-[10px] hover:bg-white/[0.04] transition-colors">
                      <DdIcon>{item.icon}</DdIcon>
                      <div>
                        <h4 className="font-outfit text-[0.88rem] font-semibold text-white mb-0.5">{item.title}</h4>
                        <p className="text-[0.78rem] text-[#7a859c] leading-snug">{item.desc}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </li>

            {/* About */}
            <li className="nav-item-landing relative">
              <a href="#" onClick={(e) => toggleMobileDropdown("about", e)} className="flex items-center gap-1 px-4 py-2 font-outfit text-[0.9rem] font-medium text-[#7a859c] hover:text-white transition-colors">
                About <Chevron />
              </a>
              <div className={`mega-dropdown ${openDropdown === "about" ? "open" : ""}`} style={{ minWidth: 380 }}>
                <div className="grid grid-cols-1 gap-1">
                  {aboutItems.map((item) => (
                    <a key={item.title} href="#" className="flex items-start gap-3 p-3 rounded-[10px] hover:bg-white/[0.04] transition-colors">
                      <DdIcon>{item.icon}</DdIcon>
                      <div>
                        <h4 className="font-outfit text-[0.88rem] font-semibold text-white mb-0.5">{item.title}</h4>
                        <p className="text-[0.78rem] text-[#7a859c] leading-snug">{item.desc}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </li>

            {/* Contact */}
            <li className="nav-item-landing relative">
              <a href="#" className="flex items-center gap-1 px-4 py-2 font-outfit text-[0.9rem] font-medium text-[#7a859c] hover:text-white transition-colors">
                Contact
              </a>
            </li>
          </ul>

          {/* Nav CTA */}
          <div className="landing-nav-cta hidden md:flex items-center gap-4">
            <Link href="/login" className="font-outfit text-[0.9rem] font-medium text-[#7a859c] hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-2.5 font-outfit text-[0.88rem] font-semibold text-black rounded-full transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:-translate-y-px"
              style={{ background: "#06b6d4" }}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="landing-mobile-toggle md:hidden bg-transparent border-none cursor-pointer p-2"
            aria-label="Menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className="block w-[22px] h-[2px] bg-white my-[5px] rounded-sm" />
            <span className="block w-[22px] h-[2px] bg-white my-[5px] rounded-sm" />
            <span className="block w-[22px] h-[2px] bg-white my-[5px] rounded-sm" />
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden" style={{ background: "rgba(4,8,16,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="px-8 py-4 flex flex-col gap-2">
              <a href="#" className="font-outfit text-[0.9rem] font-medium text-[#7a859c] py-2">Platform</a>
              <a href="#" className="font-outfit text-[0.9rem] font-medium text-[#7a859c] py-2">Industries</a>
              <a href="#" className="font-outfit text-[0.9rem] font-medium text-[#7a859c] py-2">About</a>
              <a href="#" className="font-outfit text-[0.9rem] font-medium text-[#7a859c] py-2">Contact</a>
              <div className="flex items-center gap-4 pt-4 border-t border-white/[0.04]">
                <Link href="/login" className="font-outfit text-[0.9rem] font-medium text-[#7a859c]">Sign In</Link>
                <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-2.5 font-outfit text-[0.88rem] font-semibold text-black rounded-full" style={{ background: "#06b6d4" }}>
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "#010204" }}>
        {/* Video background */}
        <video
          ref={videoRef}
          className="hero-video absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover z-0"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: `
              linear-gradient(180deg, rgba(1,2,4,0.5) 0%, rgba(1,2,4,0.25) 30%, rgba(1,2,4,0.25) 60%, rgba(1,2,4,0.95) 100%),
              radial-gradient(ellipse at center, rgba(1,2,4,0.15) 0%, rgba(1,2,4,0.5) 100%)
            `,
          }}
        />

        {/* Hero content */}
        <div className="relative z-[2] max-w-[720px] mx-auto text-center px-8 pt-24 pb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-outfit text-[0.75rem] font-semibold tracking-[0.08em] uppercase text-[#06b6d4] mb-8" style={{ background: "rgba(6,182,212,0.06)", borderColor: "rgba(6,182,212,0.15)" }}>
            <div className="badge-dot w-1.5 h-1.5 rounded-full" style={{ background: "#06b6d4" }} />
            <span>AI-Powered Space Intelligence</span>
          </div>

          <h1 className="font-outfit font-extrabold leading-[1.1] tracking-tight text-white mb-6" style={{ fontSize: "clamp(2.5rem, 5.5vw, 4rem)" }}>
            <span className="block landing-line-1">See the Signals.</span>
            <span className="block landing-line-2">
              <span className="bg-gradient-to-br from-[#06b6d4] to-[#6366f1] bg-clip-text text-transparent">Shape the Strategy.</span>
            </span>
          </h1>

          <p className="landing-hero-sub text-[1.1rem] text-[#7a859c] max-w-[560px] mx-auto mb-10 leading-relaxed">
            Signaic continuously monitors 12+ public data sources and synthesizes them with AI to deliver real-time competitive intelligence for the space and defense sector.
          </p>

          <div className="landing-hero-actions flex gap-4 justify-center flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-2.5 font-outfit text-[0.88rem] font-semibold text-black rounded-full transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:-translate-y-px"
              style={{ background: "#06b6d4" }}
            >
              Request a Briefing <ArrowIcon />
            </Link>
          </div>

          {/* Hero stats */}
          <div className="landing-hero-stats flex justify-center gap-16 mt-16 pt-10 border-t border-white/[0.08] flex-col sm:flex-row items-center sm:items-start">
            <div className="text-center">
              <div className="font-outfit font-bold text-[1.6rem] text-[#06b6d4]">
                <AnimatedCounter target={12} suffix="+" />
              </div>
              <div className="text-[0.78rem] text-[#7a859c] mt-0.5">Public Data Sources</div>
            </div>
            <div className="text-center">
              <div className="font-outfit font-bold text-[1.6rem] text-[#06b6d4]">24/7</div>
              <div className="text-[0.78rem] text-[#7a859c] mt-0.5">Continuous Monitoring</div>
            </div>
            <div className="text-center">
              <div className="font-outfit font-bold text-[1.6rem] text-[#06b6d4]">
                &lt;<AnimatedCounter target={48} suffix="hr" />
              </div>
              <div className="text-[0.78rem] text-[#7a859c] mt-0.5">Intelligence Delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TICKER ═══ */}
      <section className="py-12 border-t border-b overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.04)", background: "#040810" }}>
        <div className="text-center mb-5">
          <span className="font-outfit text-[0.7rem] font-semibold tracking-[0.15em] uppercase text-[#06b6d4]">
            Ingesting Intelligence From
          </span>
        </div>
        <div className="ticker-track">
          {/* Double the items for seamless loop */}
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={`${item.name}-${i}`} className="flex items-center gap-2 px-8 text-[0.85rem] font-medium text-[#7a859c] whitespace-nowrap">
              <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {item.icon}
              </svg>
              {item.name}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-24" style={{ background: "#040810" }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="landing-fade-in max-w-[600px] mx-auto text-center mb-14">
            <span className="font-outfit text-[0.7rem] font-semibold tracking-[0.15em] uppercase text-[#06b6d4]">
              How It Works
            </span>
            <h2 className="font-outfit font-bold leading-[1.15] tracking-tight text-white mt-3" style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}>
              From Raw Data to<br />Strategic Advantage
            </h2>
            <p className="text-[#7a859c] mt-4 text-base leading-relaxed">
              Three layers of technology working continuously to keep you ahead.
            </p>
          </div>

          <div className="process-grid-line grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              { num: "01", title: "Ingest", desc: "Automated pipelines continuously pull data from 12+ public sources: FCC filings, government contracts, patent applications, orbital tracking, job postings, and more." },
              { num: "02", title: "Synthesize", desc: "Advanced AI models identify patterns, anomalies, and strategic implications across data sources. Connecting dots that human analysts would take weeks to find." },
              { num: "03", title: "Deliver", desc: "Intelligence is packaged into weekly briefings, real-time dashboard alerts, and on-demand reports. Actionable insights delivered when and how you need them." },
            ].map((step) => (
              <div key={step.num} className="landing-fade-in text-center px-6 py-8">
                <div className="font-outfit font-extrabold text-[2rem] bg-gradient-to-br from-[#06b6d4] to-[#6366f1] bg-clip-text text-transparent mb-5">
                  {step.num}
                </div>
                <h3 className="font-outfit font-bold text-[1.15rem] text-white mb-3">{step.title}</h3>
                <p className="text-[0.9rem] text-[#7a859c] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 pb-24" style={{ background: "#010204" }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <div
            className="landing-fade-in text-center py-16 px-12 rounded-3xl relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(6,10,20,0.9), rgba(3,6,14,0.8))",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            {/* Radial glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at top, rgba(6,182,212,0.03), transparent 60%)" }} />

            <span className="relative font-outfit text-[0.7rem] font-semibold tracking-[0.15em] uppercase text-[#06b6d4]">
              Get Started
            </span>
            <h2 className="relative font-outfit font-bold text-white mt-3 leading-[1.2]" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
              Ready to See What<br />You&apos;ve Been Missing?
            </h2>
            <p className="relative text-[#7a859c] mx-auto mt-5 mb-8 max-w-[480px] text-[0.95rem]">
              Request a sample intelligence briefing for your sector. No commitment, no sales pitch. Just a demonstration of what continuous competitive intelligence looks like.
            </p>
            <Link
              href="/signup"
              className="relative inline-flex items-center gap-2 px-6 py-2.5 font-outfit text-[0.88rem] font-semibold text-black rounded-full transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:-translate-y-px"
              style={{ background: "#06b6d4" }}
            >
              Request a Sample Briefing <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t pt-16 pb-8" style={{ borderColor: "rgba(255,255,255,0.04)", background: "#040810" }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 mb-12">
            {/* Brand */}
            <div>
              <Link href="/" className="flex items-center gap-3 text-white font-outfit font-bold text-[1.3rem] tracking-tight whitespace-nowrap">
                <SignaicLogo size={28} id="footer-lg" />
                SIGN<span className="text-[#06b6d4]">AI</span>C
              </Link>
              <p className="text-[#7a859c] text-[0.85rem] mt-4 leading-relaxed max-w-[280px]">
                AI-powered competitive intelligence for the space and defense sector.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-outfit text-[0.8rem] font-semibold text-white tracking-[0.06em] uppercase mb-4">Platform</h4>
              <ul className="list-none space-y-2">
                {["Intelligence Briefings", "Competitive Dashboard", "Predictive Analytics", "Market Entry Playbooks", "API Access"].map((item) => (
                  <li key={item}><a href="#" className="text-[0.85rem] text-[#7a859c] hover:text-[#06b6d4] transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            {/* Industries */}
            <div>
              <h4 className="font-outfit text-[0.8rem] font-semibold text-white tracking-[0.06em] uppercase mb-4">Industries</h4>
              <ul className="list-none space-y-2">
                {["Satellite Operators", "Defense & Aerospace", "Space Investors", "Government & Military"].map((item) => (
                  <li key={item}><a href="#" className="text-[0.85rem] text-[#7a859c] hover:text-[#06b6d4] transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-outfit text-[0.8rem] font-semibold text-white tracking-[0.06em] uppercase mb-4">Company</h4>
              <ul className="list-none space-y-2">
                {["About Signaic", "Our Approach", "Data Sources", "Contact"].map((item) => (
                  <li key={item}><a href="#" className="text-[0.85rem] text-[#7a859c] hover:text-[#06b6d4] transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t flex justify-center" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <p className="text-[0.78rem] text-[#3e4758]">
              &copy; {new Date().getFullYear()} Signaic. A Capital H Ventures company. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
