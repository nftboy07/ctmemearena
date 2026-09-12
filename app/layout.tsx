import type { Metadata } from "next";
import "./globals.css";
import "./arena-polish.css";
import Providers from "./providers";

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
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}
