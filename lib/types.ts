export type Chain = "solana" | "ethereum" | "base" | "bnb" | "arbitrum" | "polygon";
export type Token = { id:string; chain:Chain; symbol:string; name:string; emoji:string; price:number; change5m:number; change1h:number; change24h:number; mcap:number; liquidity:number; volume:number; social:number; holders:number; age:string; risk:"LOW"|"MEDIUM"|"HIGH" };
export type Holding = { tokenId:string; amount:number; entry:number };
export type Trade = { id:string; tokenId:string; side:"BUY"|"SELL"; usd:number; price:number; time:number };
export type Post = { id:string; user:string; handle:string; verified:boolean; tokenId:string; text:string; likes:number; replies:number; time:number };
