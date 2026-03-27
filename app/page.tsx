"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Satellite, Terminal, Crosshair, ChevronRight, Radio } from "lucide-react";

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-brand-cyan/5 rounded-full blur-[120px] animate-drift-slow" />
      <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-brand-cyan/3 rounded-full blur-[150px] animate-drift-slow-reverse" />

      {/* Grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#06b6d4" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Topographic overlay lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <ellipse cx="600" cy="400" rx="500" ry="300" fill="none" stroke="#06b6d4" strokeWidth="0.5" />
        <ellipse cx="600" cy="400" rx="400" ry="240" fill="none" stroke="#06b6d4" strokeWidth="0.5" />
        <ellipse cx="600" cy="400" rx="300" ry="180" fill="none" stroke="#06b6d4" strokeWidth="0.5" />
        <ellipse cx="600" cy="400" rx="200" ry="120" fill="none" stroke="#06b6d4" strokeWidth="0.5" />
        <ellipse cx="600" cy="400" rx="100" ry="60" fill="none" stroke="#06b6d4" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

function RadarSweep() {
  return (
    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20 hidden lg:block">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        {/* Radar circles */}
        <circle cx="200" cy="200" r="180" fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3" />
        <circle cx="200" cy="200" r="140" fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.25" />
        <circle cx="200" cy="200" r="100" fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.2" />
        <circle cx="200" cy="200" r="60" fill="none" stroke="#06b6d4" strokeWidth="0.5" opacity="0.15" />

        {/* Cross lines */}
        <line x1="200" y1="20" x2="200" y2="380" stroke="#06b6d4" strokeWidth="0.3" opacity="0.15" />
        <line x1="20" y1="200" x2="380" y2="200" stroke="#06b6d4" strokeWidth="0.3" opacity="0.15" />

        {/* Sweep line */}
        <line x1="200" y1="200" x2="200" y2="20" stroke="#06b6d4" strokeWidth="1" opacity="0.6" className="origin-center animate-radar-sweep">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 200 200"
            to="360 200 200"
            dur="8s"
            repeatCount="indefinite"
          />
        </line>

        {/* Sweep gradient trail */}
        <defs>
          <linearGradient id="sweepGrad" gradientTransform="rotate(0)">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path d="M 200 200 L 200 20 A 180 180 0 0 1 380 200 Z" fill="url(#sweepGrad)" opacity="0.5">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 200 200"
            to="360 200 200"
            dur="8s"
            repeatCount="indefinite"
          />
        </path>

        {/* Blips */}
        <circle cx="260" cy="140" r="3" fill="#06b6d4" className="animate-pulse-glow" />
        <circle cx="160" cy="260" r="2" fill="#06b6d4" className="animate-pulse-glow" style={{ animationDelay: "1s" }} />
        <circle cx="300" cy="220" r="2.5" fill="#06b6d4" className="animate-pulse-glow" style={{ animationDelay: "2s" }} />
        <circle cx="120" cy="160" r="2" fill="#06b6d4" className="animate-pulse-glow" style={{ animationDelay: "0.5s" }} />
      </svg>
    </div>
  );
}

function OrbitalRing() {
  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.06] pointer-events-none hidden md:block">
      <svg viewBox="0 0 400 400" className="w-full h-full animate-spin-very-slow">
        <ellipse cx="200" cy="200" rx="190" ry="80" fill="none" stroke="#06b6d4" strokeWidth="0.5" transform="rotate(-20 200 200)" />
        <circle cx="390" cy="200" r="4" fill="#06b6d4" transform="rotate(-20 200 200)">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="-20 200 200"
            to="340 200 200"
            dur="20s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </div>
  );
}

const features = [
  {
    title: "The Orbital Brief",
    description:
      "Daily intelligence briefings synthesized from 9+ authoritative data sources, ranked by strategic impact. Know what matters before the market does.",
    icon: Satellite,
  },
  {
    title: "Ask Raptor",
    description:
      "AI-powered analyst that answers questions about contracts, filings, entities, and trends across the entire space and defense landscape.",
    icon: Terminal,
  },
  {
    title: "Entity Tracking",
    description:
      "Monitor companies, agencies, and programs. Track contract wins, FCC filings, patent activity, and regulatory changes in real time.",
    icon: Crosshair,
  },
];

const dataSources = [
  "FCC Filings",
  "SEC EDGAR",
  "Federal Register",
  "SAM.gov",
  "USPTO Patents",
  "SBIR Awards",
  "Space-Track.org",
  "USAspending.gov",
  "Defense News",
];

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    el.classList.add("opacity-0");
    requestAnimationFrame(() => {
      el.classList.remove("opacity-0");
      el.classList.add("animate-hero-enter");
    });
  }, []);

  return (
    <div className="min-h-screen bg-surface-dark relative overflow-hidden">
      <GridBackground />
      <OrbitalRing />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-5 max-w-7xl mx-auto">
        <div className="font-display font-black text-xl sm:text-2xl tracking-wider text-white select-none">
          SIG<span className="text-brand-cyan">/</span>N
          <span className="text-brand-cyan">AI</span>C
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="text-sm text-slate-400 hover:text-white transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="group inline-flex items-center gap-1.5 px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan text-sm font-medium rounded-lg hover:bg-brand-cyan/20 hover:border-brand-cyan/50 transition-all"
          >
            Get Started
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-20 sm:pt-32 pb-24 sm:pb-40">
        <div ref={heroRef} className="max-w-3xl transition-all duration-1000 ease-out">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-cyan/5 border border-brand-cyan/15 mb-8">
            <Radio className="w-3 h-3 text-brand-cyan animate-pulse-glow" />
            <span className="text-[11px] text-brand-cyan font-semibold tracking-[0.2em] uppercase">
              Live Intelligence Feed
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.95] mb-8 tracking-tight">
            Space & Defense
            <br />
            Intelligence,
            <br />
            <span className="text-brand-cyan">Automated.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-12 max-w-xl font-light">
            Signaic monitors regulatory filings, contract awards, patent activity,
            and orbital data — then synthesizes actionable intelligence briefings
            delivered daily.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link
              href="/signup"
              className="group relative inline-flex items-center gap-2 px-8 py-3.5 text-white font-semibold rounded-lg transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-brand-cyan group-hover:bg-brand-cyan-dark transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative">Request Early Access</span>
              <ChevronRight className="relative w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-slate-700/80 text-slate-400 font-medium rounded-lg hover:border-slate-500 hover:text-slate-200 transition-all"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>

        <RadarSweep />
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-24 sm:pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group relative bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 sm:p-8 hover:border-brand-cyan/20 transition-all duration-500 backdrop-blur-sm"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-brand-cyan/[0.02] to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center mb-5">
                  <feature.icon className="w-5 h-5 text-brand-cyan" strokeWidth={1.5} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed font-light">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-24 sm:pb-32">
        <div className="text-center mb-12">
          <p className="text-[11px] text-brand-cyan font-semibold tracking-[0.2em] uppercase mb-4">
            Data Pipeline
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Intelligence from Authoritative Sources
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto text-sm font-light">
            Automated pipelines ingest data from government databases, regulatory
            agencies, and industry sources — continuously.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {dataSources.map((source) => (
            <span
              key={source}
              className="px-4 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-sm text-slate-400 font-medium hover:border-brand-cyan/20 hover:text-slate-300 transition-all cursor-default"
            >
              {source}
            </span>
          ))}
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 border-y border-slate-800/60 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
            {[
              { value: "9+", label: "Data Sources" },
              { value: "Daily", label: "Briefing Cadence" },
              { value: "<5 min", label: "Intelligence Latency" },
              { value: "24/7", label: "Monitoring Coverage" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1 font-display tracking-wide">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500 uppercase tracking-[0.15em] font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-24 sm:py-32 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Intelligence Advantage,{" "}
          <span className="text-brand-cyan">Delivered.</span>
        </h2>
        <p className="text-slate-500 max-w-md mx-auto mb-10 text-sm font-light">
          Join the companies using Signaic to monitor the space and defense landscape with AI-powered precision.
        </p>
        <Link
          href="/signup"
          className="group relative inline-flex items-center gap-2 px-10 py-4 text-white font-semibold rounded-lg transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-brand-cyan group-hover:bg-brand-cyan-dark transition-colors" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative">Request Early Access</span>
          <ChevronRight className="relative w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display font-black text-lg tracking-wider text-slate-700 select-none">
            SIG<span className="text-brand-cyan/30">/</span>N
            <span className="text-brand-cyan/30">AI</span>C
          </div>
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Signaic. All rights reserved.
          </p>
          <a
            href="mailto:ryan@signaic.com"
            className="text-xs text-brand-cyan/60 hover:text-brand-cyan transition-colors"
          >
            ryan@signaic.com
          </a>
        </div>
      </footer>
    </div>
  );
}
