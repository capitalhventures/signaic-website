import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Orbitron } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Signaic | AI-Powered Competitive Intelligence",
    template: "%s | Signaic",
  },
  description:
    "Defense-grade competitive intelligence for the space and defense sector. Powered by AI.",
  metadataBase: new URL("https://signaic.com"),
  openGraph: {
    title: "Signaic | AI-Powered Competitive Intelligence",
    description:
      "Defense-grade competitive intelligence for the space and defense sector. Automated pipelines, daily briefings, and AI-powered analysis.",
    url: "https://signaic.com",
    siteName: "Signaic",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Signaic | AI-Powered Competitive Intelligence",
    description:
      "Defense-grade competitive intelligence for the space and defense sector.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${orbitron.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
