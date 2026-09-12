import { NextRequest, NextResponse } from "next/server";
import { dbEnabled, query } from "@/lib/db";
export const runtime = "nodejs";
export const maxDuration = 60;
const rpc=()=>process.env.SOLANA_RPC_URL??(process.env.ALCHEMY_API_KEY?`https://solana-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`:"https://api.mainnet-beta.solana.com");
export async function GET(request:NextRequest){
 const secret=process.env.CRON_SECRET;if(secret&&request.headers.get("authorization")!==`Bearer ${secret}`)return NextResponse.json({error:"unauthorized"},{status:401});
 if(!dbEnabled())return NextResponse.json({synced:0,reason:"database not configured"});
 const users=await query<{wallet:string}>(`SELECT wallet FROM users ORDER BY updated_at DESC LIMIT 100`);let synced=0;
 for(const u of users.rows){try{const r=await fetch(rpc(),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"getSignaturesForAddress",params:[u.wallet,{limit:20}]})});const j=await r.json();if(!r.ok||j.error)continue;for(const x of j.result??[]){const q=await query(`INSERT INTO arena_events(wallet,event_type,payload) VALUES($1,'WALLET_ACTIVITY',$2) ON CONFLICT DO NOTHING`,[u.wallet,JSON.stringify(x)]);synced+=q.rowCount??0;}}catch{}}
 return NextResponse.json({synced,wallets:users.rowCount??0,timestamp:new Date().toISOString()});
}
