import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="font-display font-black text-2xl tracking-wider text-white select-none">
          SIG<span className="text-brand-cyan">/</span>N
          <span className="text-brand-cyan">AI</span>C
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-slate-300 hover:text-white transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center px-4 py-2 bg-brand-cyan text-white text-sm font-medium rounded-lg hover:bg-brand-cyan-dark transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 pt-24 pb-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan mr-2" />
            <span className="text-xs text-brand-cyan font-medium tracking-wide">
              AI-Powered Competitive Intelligence
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            Space & Defense Intelligence,{" "}
            <span className="text-brand-cyan">Automated</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl">
            Signaic monitors regulatory filings, contract awards, patent activity,
            and orbital data across the space and defense sector — then synthesizes
            it into actionable intelligence briefings delivered daily.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center px-6 py-3 bg-brand-cyan text-white font-semibold rounded-lg hover:bg-brand-cyan-dark transition-colors"
            >
              Request Early Access
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 border border-slate-700 text-slate-300 font-medium rounded-lg hover:border-slate-500 hover:text-white transition-colors"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-8 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "The Orbital Brief",
              description:
                "Daily intelligence briefings synthesized from 9+ data sources, ranked by strategic impact. Know what matters before the market does.",
              icon: "📡",
            },
            {
              title: "Ask Raptor",
              description:
                "AI-powered analyst that answers questions about contracts, filings, entities, and trends across the entire space and defense landscape.",
              icon: "🦅",
            },
            {
              title: "Entity Tracking",
              description:
                "Monitor companies, agencies, and programs. Track contract wins, FCC filings, patent activity, and regulatory changes in real time.",
              icon: "🎯",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:border-brand-cyan/30 transition-colors"
            >
              <div className="text-2xl mb-4">{feature.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section className="max-w-7xl mx-auto px-8 pb-32">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Intelligence from Authoritative Sources
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Automated pipelines ingest data from government databases, regulatory
            agencies, and industry sources.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            "FCC Filings",
            "SEC EDGAR",
            "Federal Register",
            "SAM.gov",
            "USPTO Patents",
            "SBIR Awards",
            "Space-Track.org",
            "USAspending.gov",
            "Defense News",
          ].map((source) => (
            <span
              key={source}
              className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-slate-300 font-medium"
            >
              {source}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display font-black text-lg tracking-wider text-slate-600 select-none">
            SIG<span className="text-brand-cyan/50">/</span>N
            <span className="text-brand-cyan/50">AI</span>C
          </div>
          <p className="text-sm text-slate-600">
            &copy; {new Date().getFullYear()} Signaic. All rights reserved.
          </p>
          <a
            href="mailto:ryan@signaic.com"
            className="text-sm text-brand-cyan hover:opacity-80 transition-opacity"
          >
            ryan@signaic.com
          </a>
        </div>
      </footer>
    </div>
  );
}
