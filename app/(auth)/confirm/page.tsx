"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";

  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-10">
          <Link href="/">
            <div className="font-display font-black text-4xl tracking-wider text-white select-none inline-block">
              SIG<span className="text-brand-cyan">/</span>N
              <span className="text-brand-cyan">AI</span>C
            </div>
          </Link>
        </div>

        <div className="bg-surface-dark-elevated rounded-2xl border border-slate-700/50 p-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-brand-cyan" />
          </div>

          <h1 className="text-xl font-semibold text-white mb-3">
            Check Your Email
          </h1>

          <p className="text-sm text-slate-400 mb-2">
            We&apos;ve sent a confirmation email to
          </p>
          <p className="text-sm text-brand-cyan font-medium mb-6">{email}</p>

          <p className="text-sm text-slate-500 leading-relaxed mb-8">
            Click the link in the email to verify your account and gain access
            to the Signaic intelligence platform. The link expires in 24 hours.
          </p>

          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Didn&apos;t receive the email? Check your spam folder or contact{" "}
              <a
                href="mailto:ryan@signaic.com"
                className="text-brand-cyan hover:opacity-80"
              >
                ryan@signaic.com
              </a>
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors mt-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-dark" />}>
      <ConfirmContent />
    </Suspense>
  );
}
