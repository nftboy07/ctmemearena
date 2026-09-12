import { tokens } from "./demo";
import type { Chain, Token } from "./types";
export interface MarketProvider { name:string; chains:Chain[]; trending():Promise<Token[]>; token(chain:Chain,address:string):Promise<Token|null>; }
export const demoProvider:MarketProvider={name:"demo",chains:["solana"],async trending(){return tokens},async token(_chain,address){return tokens.find(t=>t.id===address||t.symbol.toLowerCase()===address.toLowerCase())??null}};
export const providerConfig={gmgn:{enabled:Boolean(process.env.GMGN_API_KEY),purpose:"market intelligence"},fomo:{enabled:Boolean(process.env.FOMO_API_KEY),purpose:"social/discovery"},alchemy:{enabled:Boolean(process.env.ALCHEMY_API_KEY),purpose:"wallet/on-chain"},dune:{enabled:Boolean(process.env.DUNE_API_KEY),purpose:"historical analytics"}};
