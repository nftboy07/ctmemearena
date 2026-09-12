import type { Post, Token } from "./types";
export const tokens: Token[] = [
{id:"bonk",chain:"solana",symbol:"BONK",name:"Bonk",emoji:"🐕",price:.000031,change5m:4.2,change1h:11.8,change24h:18.7,mcap:2.4e9,liquidity:115e6,volume:86e6,social:92,holders:812000,age:"2y",risk:"LOW"},
{id:"wif",chain:"solana",symbol:"WIF",name:"dogwifhat",emoji:"🐶",price:1.37,change5m:3.6,change1h:9.4,change24h:14.2,mcap:1.37e9,liquidity:92e6,volume:61e6,social:95,holders:248000,age:"2y",risk:"LOW"},
{id:"popcat",chain:"solana",symbol:"POPCAT",name:"Popcat",emoji:"🐱",price:.51,change5m:7.5,change1h:16.3,change24h:31.1,mcap:503e6,liquidity:44e6,volume:39e6,social:98,holders:164000,age:"1y",risk:"MEDIUM"},
{id:"mew",chain:"solana",symbol:"MEW",name:"cat in a dogs world",emoji:"😼",price:.0049,change5m:-2.4,change1h:2.2,change24h:8.8,mcap:458e6,liquidity:37e6,volume:31e6,social:88,holders:121000,age:"1y",risk:"MEDIUM"},
{id:"goat",chain:"solana",symbol:"GOAT",name:"Goatseus Maximus",emoji:"🐐",price:.128,change5m:12.2,change1h:24.1,change24h:39.6,mcap:128e6,liquidity:18e6,volume:22e6,social:99,holders:79000,age:"10mo",risk:"HIGH"},
{id:"giga",chain:"solana",symbol:"GIGA",name:"Gigachad",emoji:"🗿",price:.021,change5m:5.1,change1h:10.8,change24h:19.4,mcap:210e6,liquidity:26e6,volume:17e6,social:94,holders:88000,age:"1y",risk:"MEDIUM"}
];
export const posts: Post[] = [
{id:"p1",user:"Mika",handle:"@mika_onchain",verified:true,tokenId:"goat",text:"GOAT is back on the CT front page. Volume is accelerating while social is still climbing.",likes:4821,replies:410,time:2},
{id:"p2",user:"DegenDesk",handle:"@degendesk",verified:true,tokenId:"popcat",text:"POPCAT +31% today. Watching whether new liquidity follows the attention.",likes:3190,replies:260,time:5},
{id:"p3",user:"SolShill",handle:"@solshill",verified:false,tokenId:"wif",text:"WIF crowd is waking up again. Timeline sentiment just flipped green.",likes:1880,replies:144,time:8}
];
