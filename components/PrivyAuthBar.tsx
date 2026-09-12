"use client";

import { useEffect, useState } from "react";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";

export default function PrivyAuthBar() {
  const { ready, authenticated, user, logout, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const [syncing, setSyncing] = useState(false);
  const { login } = useLogin({ onComplete: async () => { await sync(); }, onError: (error) => console.error("Privy login failed", error) });

  async function sync() {
    if (!authenticated) return;
    setSyncing(true);
    try {
      const token = await getAccessToken();
      if (token) await fetch("/api/auth/sync", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    } finally { setSyncing(false); }
  }

  useEffect(() => { if (authenticated) void sync(); }, [authenticated]);

  if (!ready) return <div className="privy-authbar"><span>INITIALIZING SECURE LOGIN…</span></div>;
  if (!authenticated) return <div className="privy-authbar"><span>LOGIN</span><button onClick={() => login()}>GOOGLE · X · EMAIL</button></div>;

  const wallet = wallets.find((w) => w.standardWallet.name === "Privy") ?? wallets[0];
  const social = user?.linkedAccounts.find((account) => account.type === "twitter_oauth" || account.type === "google_oauth");
  const label = social && "username" in social && social.username ? `@${social.username}` : user?.email?.address ?? user?.id ?? "PLAYER";
  return <div className="privy-authbar"><span>PLAYER · {label}</span><span>{wallet?.address ? `${wallet.address.slice(0, 4)}…${wallet.address.slice(-4)}` : "NO SOLANA WALLET"}</span>{syncing && <span>SYNCING…</span>}<button onClick={() => logout()}>LOG OUT</button></div>;
}
