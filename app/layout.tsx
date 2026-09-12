import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CT Meme Arena",
  description: "The multiplayer meme-coin arena for Crypto Twitter.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
