import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulatory Guide",
  description: "Comprehensive space and telecommunications regulatory reference across 54 jurisdictions worldwide. Search by country, region, or regulatory body.",
};

export default function RegulatoryGuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
