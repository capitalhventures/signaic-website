import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Sources Status",
  description: "Health and freshness monitoring for all intelligence data sources including FCC, SEC, USPTO, SAM.gov, and more.",
};

export default function DataSourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
