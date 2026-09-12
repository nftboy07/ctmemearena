"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import PrivyAuthBar from "@/components/PrivyAuthBar";

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) return <>{children}</>;
  return (
    <PrivyProvider appId={appId} config={{
      loginMethods: ["google", "twitter", "email", "wallet"],
      appearance: { theme: "dark", accentColor: "#7c3aed", logo: "/favicon.ico" },
      embeddedWallets: { ethereum: { createOnLogin: "off" }, solana: { createOnLogin: "users-without-wallets" } },
    }}>
      <PrivyAuthBar />
      {children}
    </PrivyProvider>
  );
}
