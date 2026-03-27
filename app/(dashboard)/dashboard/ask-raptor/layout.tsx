import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask Raptor",
  description: "AI-powered intelligence analyst for space and defense sector queries. Ask about regulatory filings, competitive intelligence, orbital data, and more.",
};

export default function AskRaptorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
