import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entities",
  description: "Track companies, agencies, and programs across the space and defense sector. Monitor contract wins, filings, patents, and regulatory changes.",
};

export default function EntitiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
