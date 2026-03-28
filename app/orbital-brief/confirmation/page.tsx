"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MarketingLayout } from "@/components/marketing-layout";
import { SignaicLogo } from "@/components/signaic-logo";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "your email";

  return (
    <div className="max-w-lg mx-auto text-center">
      <div className="flex justify-center mb-8">
        <SignaicLogo size="lg" showTagline={false} />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-chakra-petch)] mb-4">
        You&apos;re All Set
      </h1>

      <p className="text-gray-400 text-sm leading-relaxed mb-8">
        We&apos;ve received your Orbital Brief configuration. Our team will reach
        out to <span className="text-white">{email}</span> within 24 hours to
        finalize your subscription and deliver your first brief.
      </p>

      <button
        className="bg-[#00D4FF] text-[#010204] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#00B8E0] transition-colors cursor-pointer"
        onClick={() => router.push("/")}
      >
        Back To Home
      </button>
    </div>
  );
}

export default function OrbitalBriefConfirmationPage() {
  return (
    <MarketingLayout>
      <div className="pt-32 pb-16 px-6">
        <Suspense
          fallback={
            <div className="text-center text-gray-500 pt-16">Loading...</div>
          }
        >
          <ConfirmationContent />
        </Suspense>
      </div>
    </MarketingLayout>
  );
}
