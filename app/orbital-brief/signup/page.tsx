"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { MarketingLayout } from "@/components/marketing-layout";

type TierType = "weekly" | "biweekly" | "monthly";

interface FormData {
  tier: TierType;
  sectors: string[];
  otherSector: string;
  companies: string;
  primaryEmail: string;
  email2: string;
  email3: string;
}

const tierDetails: Record<TierType, { name: string; price: string }> = {
  weekly: { name: "Weekly Intel", price: "$499/month" },
  biweekly: { name: "Bi-Weekly Deep Dive", price: "$399/month" },
  monthly: { name: "Monthly Strategic", price: "$349/month" },
};

const sectorOptions = [
  "Commercial Space",
  "Defense And National Security",
  "Satellite Communications",
  "Launch Services",
  "Earth Observation",
  "Space Situational Awareness",
  "Other",
];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTier = (searchParams.get("tier") as TierType) || "weekly";

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    tier: initialTier,
    sectors: [],
    otherSector: "",
    companies: "",
    primaryEmail: "",
    email2: "",
    email3: "",
  });

  const canNext = (): boolean => {
    switch (step) {
      case 1:
        return !!formData.tier;
      case 2:
        return formData.sectors.length > 0;
      case 3:
        return true;
      case 4:
        return isValidEmail(formData.primaryEmail);
      default:
        return true;
    }
  };

  const toggleSector = (sector: string) => {
    setFormData((prev) => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter((s) => s !== sector)
        : [...prev.sectors, sector],
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => router.push("/orbital-brief")}
        className="text-sm text-[#00D4FF] hover:underline mb-8 inline-block cursor-pointer"
      >
        &larr; Back To The Orbital Brief
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold font-[family-name:var(--font-chakra-petch)] mb-8 text-center">
        Orbital Brief Signup
      </h1>

      {/* Progress bar */}
      <div className="mb-8">
        <p className="text-sm text-gray-400 mb-2 text-center">
          Step {step} Of 5
        </p>
        <div className="w-full h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00D4FF] rounded-full transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1 — Select Your Cadence */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-6 font-[family-name:var(--font-chakra-petch)]">
            Select Your Cadence
          </h2>
          <div className="space-y-3">
            {(Object.keys(tierDetails) as TierType[]).map((tier) => (
              <div
                key={tier}
                className={`rounded-xl p-4 cursor-pointer transition-colors ${
                  formData.tier === tier
                    ? "border-2 border-[#00D4FF] bg-[#0A0A1A]"
                    : "border border-[#1a1a2e] bg-[#0A0A1A] hover:border-gray-600"
                }`}
                onClick={() => setFormData((prev) => ({ ...prev, tier }))}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">
                    {tierDetails[tier].name}
                  </span>
                  <span className="text-[#00D4FF] font-semibold">
                    {tierDetails[tier].price}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-8">
            <button
              className="bg-[#00D4FF] text-[#010204] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#00B8E0] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setStep(2)}
              disabled={!canNext()}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Choose Your Focus */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold mb-6 font-[family-name:var(--font-chakra-petch)]">
            Choose Your Focus
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {sectorOptions.map((sector) => (
              <button
                key={sector}
                className={`px-4 py-2 rounded-full text-sm transition-colors cursor-pointer ${
                  formData.sectors.includes(sector)
                    ? "bg-[#00D4FF] text-[#010204] font-medium"
                    : "border border-[#1a1a2e] text-gray-400 hover:border-gray-500"
                }`}
                onClick={() => toggleSector(sector)}
              >
                {sector}
              </button>
            ))}
          </div>
          {formData.sectors.includes("Other") && (
            <input
              type="text"
              placeholder="Describe your sector focus..."
              value={formData.otherSector}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  otherSector: e.target.value,
                }))
              }
              className="w-full mt-2 px-4 py-2.5 rounded-lg bg-[#0A0A1A] border border-[#1a1a2e] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00D4FF]"
            />
          )}
          <div className="flex justify-between mt-8">
            <button
              className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              className="bg-[#00D4FF] text-[#010204] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#00B8E0] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setStep(3)}
              disabled={!canNext()}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Track Specific Companies */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-semibold mb-6 font-[family-name:var(--font-chakra-petch)]">
            Track Specific Companies
          </h2>
          <textarea
            placeholder="e.g., SpaceX, Northrop Grumman, Amazon Leo"
            value={formData.companies}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, companies: e.target.value }))
            }
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A1A] border border-[#1a1a2e] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00D4FF] resize-none"
          />
          <p className="text-xs text-gray-600 mt-2">
            Enter company names separated by commas. You can track up to 20
            companies.
          </p>
          <div className="flex justify-between mt-8">
            <button
              className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
              onClick={() => setStep(2)}
            >
              Back
            </button>
            <button
              className="bg-[#00D4FF] text-[#010204] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#00B8E0] transition-colors cursor-pointer"
              onClick={() => setStep(4)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Delivery Details */}
      {step === 4 && (
        <div>
          <h2 className="text-xl font-semibold mb-6 font-[family-name:var(--font-chakra-petch)]">
            Delivery Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Primary Email Address *
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={formData.primaryEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    primaryEmail: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A1A] border border-[#1a1a2e] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00D4FF]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Additional Recipient #2 (Optional)
              </label>
              <input
                type="email"
                placeholder="colleague@company.com"
                value={formData.email2}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email2: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A1A] border border-[#1a1a2e] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00D4FF]"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Additional Recipient #3 (Optional)
              </label>
              <input
                type="email"
                placeholder="team@company.com"
                value={formData.email3}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email3: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-lg bg-[#0A0A1A] border border-[#1a1a2e] text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00D4FF]"
              />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Your Orbital Brief will be delivered to all email addresses listed
            above. Maximum 3 recipients per subscription.
          </p>
          <div className="flex justify-between mt-8">
            <button
              className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
              onClick={() => setStep(3)}
            >
              Back
            </button>
            <button
              className="bg-[#00D4FF] text-[#010204] font-semibold px-6 py-2.5 rounded-lg hover:bg-[#00B8E0] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setStep(5)}
              disabled={!canNext()}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 5 — Review & Submit */}
      {step === 5 && (
        <div>
          <h2 className="text-xl font-semibold mb-6 font-[family-name:var(--font-chakra-petch)]">
            Review & Submit
          </h2>

          {/* Summary */}
          <div className="rounded-xl border border-[#1a1a2e] bg-[#0A0A1A] p-6 mb-6 space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Cadence
              </p>
              <p className="text-white text-sm">
                {tierDetails[formData.tier].name} —{" "}
                {tierDetails[formData.tier].price}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Sector Focus
              </p>
              <p className="text-white text-sm">
                {formData.sectors.join(", ")}
                {formData.sectors.includes("Other") && formData.otherSector
                  ? ` (${formData.otherSector})`
                  : ""}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Tracked Companies
              </p>
              <p className="text-white text-sm">
                {formData.companies || "None specified"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                Delivery Emails
              </p>
              <p className="text-white text-sm">{formData.primaryEmail}</p>
              {formData.email2 && (
                <p className="text-white text-sm">{formData.email2}</p>
              )}
              {formData.email3 && (
                <p className="text-white text-sm">{formData.email3}</p>
              )}
            </div>
          </div>

          {/* Payment placeholder */}
          <div className="rounded-xl border border-dashed border-[#1a1a2e] bg-[#0A0A1A] p-6 mb-6 text-center">
            <p className="text-sm text-gray-500">
              Payment processing coming soon. Click Submit below to register
              your interest and our team will reach out to{" "}
              <span className="text-white">{formData.primaryEmail}</span> within
              24 hours to finalize your subscription.
            </p>
          </div>

          <div className="flex justify-between mt-8">
            <button
              className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
              onClick={() => setStep(4)}
            >
              Back
            </button>
            <button
              className="bg-[#00D4FF] text-[#010204] font-semibold px-8 py-2.5 rounded-lg hover:bg-[#00B8E0] transition-colors cursor-pointer"
              onClick={() =>
                router.push(
                  `/orbital-brief/confirmation?email=${encodeURIComponent(formData.primaryEmail)}`
                )
              }
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrbitalBriefSignupPage() {
  return (
    <MarketingLayout>
      <div className="pt-24 pb-16 px-6">
        <Suspense
          fallback={
            <div className="text-center text-gray-500 pt-16">Loading...</div>
          }
        >
          <SignupContent />
        </Suspense>
      </div>
    </MarketingLayout>
  );
}
