import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Command Center",
  description: "Daily intelligence briefings, watchlist alerts, and system status for space and defense competitive intelligence.",
};

export default function CommandCenterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
