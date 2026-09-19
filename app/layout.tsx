import type { Metadata } from "next";
import { Outfit, Unbounded } from "next/font/google";
import "./globals.css";
import "./arena-polish.css";
import Providers from "./providers";

const freshFont = Outfit({ weight: ["400", "500", "600", "700", "800"], subsets: ["latin"], variable: "--font-body" });
const noirDisplay = Unbounded({ weight: ["500", "700", "800", "900"], subsets: ["latin"], variable: "--font-display" });
const displayFont = noirDisplay;
const bodyFont = freshFont;

export const metadata: Metadata = {
  title: "CT Arena — The World of Crypto Twitter",
  description: "Explore the living world of Crypto Twitter. Discover traders, wallets, blockchain districts, live market events and seasonal fame.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://ctarena.xyz"),
  openGraph: {
    title: "CT Arena — The World of Crypto Twitter",
    description: "Explore. Discover. Flex. The living world of Crypto Twitter.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CT Arena — The World of Crypto Twitter",
    description: "The living world of Crypto Twitter.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}><body><Providers>{children}</Providers></body></html>;
}
