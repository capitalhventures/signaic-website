import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="font-display font-black text-5xl md:text-7xl tracking-wider text-white mb-10 select-none">
          SIG<span className="text-brand-cyan">/</span>N
          <span className="text-brand-cyan">AI</span>C
        </div>
        <h1 className="text-slate-100 text-xl md:text-2xl font-semibold mb-4">
          Platform Upgrade in Progress
        </h1>
        <p className="text-slate-400 text-base md:text-lg mb-8">
          Signaic is undergoing a major platform upgrade.
        </p>
        <div className="flex flex-col items-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-brand-cyan text-white font-medium rounded-lg hover:bg-brand-cyan-dark transition-colors"
          >
            Sign In
          </Link>
          <p className="text-slate-500 text-sm">
            For early access:{" "}
            <a
              href="mailto:ryan@signaic.com"
              className="text-brand-cyan hover:opacity-80 transition-opacity"
            >
              ryan@signaic.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
