"use client";
import { useEffect,useState } from "react";
import { useLogin,usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
const bar={position:"fixed" as const,top:8,right:8,zIndex:60,display:"flex",alignItems:"center",gap:8,padding:"7px 9px",border:"1px solid #2a2738",borderRadius:10,background:"rgba(9,8,16,.92)",backdropFilter:"blur(14px)",fontSize:9,color:"#8e899b"};
const button={border:"1px solid #6653ce",background:"#151128",color:"#eee",borderRadius:7,padding:"6px 9px",fontSize:8,fontWeight:800 as const,cursor:"pointer"};
export default function PrivyAuthBar(){
 const {ready,authenticated,user,logout,getAccessToken}=usePrivy();const {wallets}=useWallets();const [syncing,setSyncing]=useState(false);
 const sync=async()=>{if(!authenticated)return;setSyncing(true);try{const token=await getAccessToken();if(token){const r=await fetch("/api/auth/sync",{method:"POST",headers:{Authorization:`Bearer ${token}`}});if(!r.ok)console.error("Arena identity sync failed",await r.text())}}finally{setSyncing(false)}};
 const {login}=useLogin({onComplete:async()=>{await sync()},onError:e=>console.error("Privy login failed",e)});useEffect(()=>{if(authenticated)void sync()},[authenticated]);
 if(!ready)return <div style={bar}><span>INITIALIZING SECURE LOGIN…</span></div>;
 if(!authenticated)return <div style={bar}><span>LOGIN</span><button style={button} onClick={()=>login()}>GOOGLE · X · EMAIL</button></div>;
 const wallet=wallets.find(w=>w.standardWallet.name==="Privy")??wallets[0];const social=user?.linkedAccounts.find(a=>a.type==="twitter_oauth"||a.type==="google_oauth");const label=social&&"username" in social&&social.username?`@${social.username}`:user?.email?.address??user?.id??"PLAYER";const signOut=async()=>{try{await fetch("/api/auth/logout",{method:"POST"})}finally{await logout()}};
 return <div style={bar}><span>PLAYER · {label}</span><span>{wallet?.address?`${wallet.address.slice(0,4)}…${wallet.address.slice(-4)}`:"NO SOLANA WALLET"}</span>{syncing&&<span>SYNCING…</span>}<button style={button} onClick={signOut}>LOG OUT</button></div>;
}
