import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Request early access to Signaic — AI-powered competitive intelligence for the space and defense sector.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
