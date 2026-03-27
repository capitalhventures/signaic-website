import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Orbital Brief",
  description: "Configurable AI-generated intelligence reports for the space and defense sector. Custom briefings by sector, depth, and date range.",
};

export default function OrbitalBriefLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
