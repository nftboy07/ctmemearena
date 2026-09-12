import type { Holding, Token, Trade } from "./types";

export function executePaperTrade(balance:number, holdings:Holding[], trades:Trade[], token:Token, side:"BUY"|"SELL", usd:number){
 if(!Number.isFinite(usd)||usd<=0) throw new Error("Invalid trade size");
 const next=holdings.map(h=>({...h})); const i=next.findIndex(h=>h.tokenId===token.id);
 if(side==="BUY"){
  if(usd>balance) throw new Error("Insufficient paper balance");
  if(i<0) next.push({tokenId:token.id,amount:usd/token.price,entry:token.price});
  else {const h=next[i]; const old=h.amount*h.entry; h.amount+=usd/token.price; h.entry=(old+usd)/h.amount;}
  return {balance:balance-usd,holdings:next,trade:{id:globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`,tokenId:token.id,side,usd,price:token.price,time:Date.now()} as Trade,trades};
 }
 if(i<0) throw new Error("No position");
 const h=next[i],value=h.amount*token.price,sell=Math.min(usd,value); h.amount-=sell/token.price;
 if(h.amount<=1e-12) next.splice(i,1);
 return {balance:balance+sell,holdings:next,trade:{id:globalThis.crypto?.randomUUID?.()??`${Date.now()}-${Math.random()}`,tokenId:token.id,side,usd:sell,price:token.price,time:Date.now()} as Trade,trades};
}
export function portfolioValue(balance:number,holdings:Holding[],all:Token[]){return balance+holdings.reduce((sum,h)=>sum+h.amount*(all.find(t=>t.id===h.tokenId)?.price??0),0)}
