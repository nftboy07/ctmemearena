"use client";
import { useEffect,useState } from "react";
import { useLogin,usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
export default function PrivyAuthBar(){
 const {ready,authenticated,user,logout,getAccessToken}=usePrivy();const {wallets}=useWallets();const [syncing,setSyncing]=useState(false);
 const sync=async()=>{if(!authenticated)return;setSyncing(true);try{const token=await getAccessToken();if(token){const r=await fetch("/api/auth/sync",{method:"POST",headers:{Authorization:`Bearer ${token}`}});if(!r.ok)console.error("Arena identity sync failed",await r.text())}}finally{setSyncing(false)}};
 const {login}=useLogin({onComplete:async()=>{await sync()},onError:e=>console.error("Privy login failed",e)});
 useEffect(()=>{if(authenticated)void sync()},[authenticated]);
 if(!ready)return <div className="privy-authbar"><span>INITIALIZING SECURE LOGIN…</span></div>;
 if(!authenticated)return <div className="privy-authbar"><span>LOGIN</span><button onClick={()=>login()}>GOOGLE · X · EMAIL</button></div>;
 const wallet=wallets.find(w=>w.standardWallet.name==="Privy")??wallets[0];const social=user?.linkedAccounts.find(a=>a.type==="twitter_oauth"||a.type==="google_oauth");const label=social&&"username" in social&&social.username?`@${social.username}`:user?.email?.address??user?.id??"PLAYER";
 const signOut=async()=>{try{await fetch("/api/auth/logout",{method:"POST"})}finally{await logout()}};
 return <div className="privy-authbar"><span>PLAYER · {label}</span><span>{wallet?.address?`${wallet.address.slice(0,4)}…${wallet.address.slice(-4)}`:"NO SOLANA WALLET"}</span>{syncing&&<span>SYNCING…</span>}<button onClick={signOut}>LOG OUT</button></div>;
}
