"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useLinkAccount,
  useLogin,
  useLoginWithEmail,
  usePrivy,
} from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";

const buttonBase: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 12,
  minHeight: 48,
  padding: "0 16px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  color: "#fff",
  background: "#171522",
  transition: "transform .15s ease, border-color .15s ease, background .15s ease",
};

const socialButton = (background: string): React.CSSProperties => ({
  ...buttonBase,
  background,
});

const modalStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  display: "grid",
  placeItems: "center",
  padding: 20,
  background: "rgba(3,2,8,.76)",
  backdropFilter: "blur(18px)",
};

const cardStyle: React.CSSProperties = {
  width: "min(430px, 100%)",
  border: "1px solid rgba(255,255,255,.11)",
  borderRadius: 24,
  padding: 24,
  background: "linear-gradient(180deg, rgba(25,21,40,.98), rgba(10,9,17,.98))",
  boxShadow: "0 30px 100px rgba(0,0,0,.55)",
};

function LogoMark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
      <div
        style={{
          width: 38,
          height: 38,
          display: "grid",
          placeItems: "center",
          borderRadius: 12,
          background: "linear-gradient(135deg,#8b5cf6,#22d3ee)",
          color: "#07060c",
          fontWeight: 1000,
          fontSize: 17,
        }}
      >
        CT
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 1000, letterSpacing: ".08em" }}>CT ARENA</div>
        <div style={{ fontSize: 9, color: "#8f899f", letterSpacing: ".12em" }}>THE WORLD OF CRYPTO TWITTER</div>
      </div>
    </div>
  );
}

export default function PrivyAuthBar() {
  const { ready, authenticated, user, logout, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const { login } = useLogin({
    onComplete: async () => {
      await sync();
    },
    onError: (error) => console.error("CT Arena login failed", error),
  });
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { linkTwitter } = useLinkAccount({
    onSuccess: async () => {
      setLinkingTwitter(false);
      setShowTwitterOnboarding(false);
      await sync();
    },
    onError: (error) => {
      console.error("CT Arena Twitter linking failed", error);
      setLinkingTwitter(false);
    },
  });

  const [syncing, setSyncing] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showTwitterOnboarding, setShowTwitterOnboarding] = useState(false);
  const [linkingTwitter, setLinkingTwitter] = useState(false);

  const twitterLinked = useMemo(
    () => Boolean(user?.linkedAccounts.some((account) => account.type === "twitter_oauth")),
    [user?.linkedAccounts],
  );

  const sync = async () => {
    if (!authenticated) return;
    setSyncing(true);
    try {
      const token = await getAccessToken();
      if (token) {
        const response = await fetch("/api/auth/sync", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) console.error("Arena identity sync failed", await response.text());
      }
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    void sync();
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated || twitterLinked) return;
    const alreadyPrompted = window.sessionStorage.getItem("ctarena-twitter-prompted");
    if (!alreadyPrompted) {
      window.sessionStorage.setItem("ctarena-twitter-prompted", "1");
      setShowTwitterOnboarding(true);
    }
  }, [authenticated, twitterLinked]);

  const startEmail = () => {
    setAuthError("");
    setEmailMode(true);
    setCodeSent(false);
    setCode("");
  };

  const requestCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setAuthError("Enter a valid email address.");
      return;
    }
    setEmailBusy(true);
    setAuthError("");
    try {
      await sendCode({ email: normalizedEmail });
      setEmail(normalizedEmail);
      setCodeSent(true);
    } catch (error) {
      console.error(error);
      setAuthError("We couldn't send the code. Please try again.");
    } finally {
      setEmailBusy(false);
    }
  };

  const verifyCode = async () => {
    if (!/^\d{4,8}$/.test(code.trim())) {
      setAuthError("Enter the verification code from your email.");
      return;
    }
    setEmailBusy(true);
    setAuthError("");
    try {
      await loginWithCode({ code: code.trim() });
    } catch (error) {
      console.error(error);
      setAuthError("That code is invalid or expired. Request a new one and try again.");
    } finally {
      setEmailBusy(false);
    }
  };

  const loginWith = (method: "apple" | "google" | "twitter" | "wallet") => {
    setAuthError("");
    void login({ loginMethods: [method] });
  };

  const connectTwitter = async () => {
    setLinkingTwitter(true);
    try {
      await linkTwitter();
    } catch (error) {
      console.error(error);
      setLinkingTwitter(false);
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      await logout();
    }
  };

  if (!ready) {
    return (
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 60, color: "#aaa2b8", fontSize: 10 }}>
        SECURE LOGIN…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={modalStyle}>
        <div style={cardStyle}>
          <LogoMark />
          <h1 style={{ margin: "0 0 8px", fontSize: 29, lineHeight: 1.05, letterSpacing: "-.04em" }}>
            Enter the Arena.
          </h1>
          <p style={{ margin: "0 0 20px", color: "#938da2", fontSize: 13, lineHeight: 1.5 }}>
            Create your CT identity and jump into the living world. No wallet required.
          </p>

          {!emailMode ? (
            <div style={{ display: "grid", gap: 10 }}>
              <button style={socialButton("#fff")} onClick={() => loginWith("apple")}>
                <span style={{ color: "#000" }}> &nbsp; Continue with Apple</span>
              </button>
              <button style={socialButton("#fff")} onClick={() => loginWith("google")}>
                <span style={{ color: "#171717" }}>G &nbsp; Continue with Google</span>
              </button>
              <button style={socialButton("#050505")} onClick={() => loginWith("twitter")}>
                𝕏 &nbsp; Continue with X
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "5px 0", color: "#625d6d", fontSize: 10 }}>
                <span style={{ height: 1, flex: 1, background: "#292532" }} /> OR <span style={{ height: 1, flex: 1, background: "#292532" }} />
              </div>
              <button style={socialButton("#171522")} onClick={startEmail}>
                ✉ &nbsp; Continue with Email
              </button>
              <button
                style={{ ...buttonBase, minHeight: 42, color: "#bdb5cb", background: "transparent", borderColor: "#2b2637" }}
                onClick={() => loginWith("wallet")}
              >
                ◇ &nbsp; Connect Wallet
              </button>
              <div style={{ marginTop: 4, textAlign: "center", color: "#6e6878", fontSize: 10 }}>
                Apple, Google, X or email gets you in instantly. Wallet is optional.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <button
                onClick={() => setEmailMode(false)}
                style={{ border: 0, background: "transparent", color: "#9d95ad", textAlign: "left", padding: 0, cursor: "pointer", fontSize: 11 }}
              >
                ← Back to all login options
              </button>
              <label style={{ color: "#bcb4c9", fontSize: 11, fontWeight: 800 }}>EMAIL ADDRESS</label>
              <input
                autoFocus
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void (codeSent ? verifyCode() : requestCode());
                }}
                style={{ width: "100%", boxSizing: "border-box", minHeight: 50, borderRadius: 12, border: "1px solid #393344", background: "#0d0b14", color: "#fff", padding: "0 14px", outline: "none" }}
              />
              {codeSent && (
                <>
                  <label style={{ color: "#bcb4c9", fontSize: 11, fontWeight: 800 }}>VERIFICATION CODE</label>
                  <input
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void verifyCode();
                    }}
                    style={{ width: "100%", boxSizing: "border-box", minHeight: 50, borderRadius: 12, border: "1px solid #393344", background: "#0d0b14", color: "#fff", padding: "0 14px", outline: "none", letterSpacing: ".22em", fontSize: 18 }}
                  />
                </>
              )}
              {authError && <div style={{ color: "#fb7185", fontSize: 11 }}>{authError}</div>}
              <button
                disabled={emailBusy}
                style={{ ...buttonBase, background: "linear-gradient(135deg,#7c3aed,#2563eb)", borderColor: "transparent", opacity: emailBusy ? .6 : 1 }}
                onClick={() => void (codeSent ? verifyCode() : requestCode())}
              >
                {emailBusy ? "PLEASE WAIT…" : codeSent ? "VERIFY & ENTER ARENA" : "SEND LOGIN CODE"}
              </button>
              {codeSent && (
                <button disabled={emailBusy} onClick={() => void requestCode()} style={{ border: 0, background: "transparent", color: "#9f8cf7", cursor: "pointer", fontSize: 11 }}>
                  Resend code
                </button>
              )}
              <div style={{ color: "#696273", fontSize: 10, textAlign: "center" }}>We'll email you a one-time code. No password to remember.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const wallet = wallets.find((item) => item.standardWallet.name === "Privy") ?? wallets[0];
  const social = user?.linkedAccounts.find((account) => account.type === "twitter_oauth" || account.type === "google_oauth" || account.type === "apple_oauth");
  const label = social && "username" in social && social.username
    ? `@${social.username}`
    : user?.email?.address ?? user?.id ?? "PLAYER";

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          gap: 8,
          maxWidth: "calc(100vw - 20px)",
          padding: "8px 10px",
          border: "1px solid #2a2738",
          borderRadius: 12,
          background: "rgba(9,8,16,.92)",
          backdropFilter: "blur(14px)",
          fontSize: 9,
          color: "#8e899b",
        }}
      >
        <span style={{ color: "#eee", fontWeight: 800 }}>PLAYER · {label}</span>
        <span>{wallet?.address ? `${wallet.address.slice(0, 4)}…${wallet.address.slice(-4)}` : "NO SOLANA WALLET"}</span>
        {syncing && <span>SYNCING…</span>}
        {!twitterLinked && (
          <button onClick={() => setShowTwitterOnboarding(true)} style={{ ...buttonBase, minHeight: 30, padding: "0 10px", fontSize: 9, borderRadius: 8 }}>
            𝕏 CONNECT X
          </button>
        )}
        <button onClick={() => void signOut()} style={{ ...buttonBase, minHeight: 30, padding: "0 10px", fontSize: 9, borderRadius: 8 }}>
          LOG OUT
        </button>
      </div>

      {showTwitterOnboarding && !twitterLinked && (
        <div style={modalStyle}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: "#8d7cff", fontWeight: 900, letterSpacing: ".12em", marginBottom: 12 }}>WELCOME TO CT ARENA</div>
            <h2 style={{ margin: "0 0 9px", fontSize: 27, letterSpacing: "-.04em" }}>Build your CT identity.</h2>
            <p style={{ margin: "0 0 20px", color: "#938da2", fontSize: 13, lineHeight: 1.55 }}>
              Connect your X account to bring your handle and avatar into the Arena, follow traders, and unlock your social CT profile.
            </p>
            <button
              disabled={linkingTwitter}
              onClick={() => void connectTwitter()}
              style={{ ...buttonBase, width: "100%", background: "#050505", opacity: linkingTwitter ? .6 : 1 }}
            >
              {linkingTwitter ? "CONNECTING X…" : "𝕏  CONNECT X ACCOUNT"}
            </button>
            <button
              onClick={() => setShowTwitterOnboarding(false)}
              style={{ width: "100%", marginTop: 9, minHeight: 42, border: 0, background: "transparent", color: "#8f899f", cursor: "pointer", fontSize: 11 }}
            >
              Skip for now — I just want to explore
            </button>
          </div>
        </div>
      )}
    </>
  );
}
