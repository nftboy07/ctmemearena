export type DemoPlayer = {
 wallet:string; displayName:string; handle:string; avatar:string; chain:string;
 pnl:number; unrealized:number; volume:number; wins:number; losses:number; bestTrade:number;
 fomo:number; diamond:number; sniper:number; trades:number; followers:number; level:number; xp:number; badges:string[];
};

export const DEMO_PLAYERS: DemoPlayer[] = [
 {wallet:"demo:dumbcrayoneater",displayName:"DumbCrayonEater",handle:"@DumbCrayonEater",avatar:"https://api.dicebear.com/9.x/shapes/svg?seed=DumbCrayonEater",chain:"solana",pnl:2262932.53,unrealized:184220,volume:18400000,wins:142,losses:31,bestTrade:612840,fomo:99,diamond:94,sniper:97,trades:173,followers:12840,level:91,xp:926530,badges:["FOMO KING","DIAMOND HANDS","EARLY SNIPER"]},
 {wallet:"demo:salem",displayName:"Salem",handle:"@Salem1299534",avatar:"https://api.dicebear.com/9.x/shapes/svg?seed=Salem",chain:"solana",pnl:1685861.35,unrealized:94120,volume:12700000,wins:119,losses:28,bestTrade:481220,fomo:91,diamond:88,sniper:93,trades:147,followers:9320,level:83,xp:801244,badges:["WHALE","FOMO RUNNER"]},
 {wallet:"demo:nate",displayName:"Nate",handle:"@Natan_benish",avatar:"https://api.dicebear.com/9.x/shapes/svg?seed=Nate",chain:"solana",pnl:1669063.89,unrealized:221430,volume:11300000,wins:108,losses:22,bestTrade:533901,fomo:96,diamond:91,sniper:95,trades:130,followers:8410,level:81,xp:774130,badges:["SNIPER","DIAMOND HANDS"]},
 {wallet:"demo:burgz",displayName:"Burgz",handle:"@brrgrrz",avatar:"https://api.dicebear.com/9.x/shapes/svg?seed=Burgz",chain:"base",pnl:986868.39,unrealized:73210,volume:8300000,wins:87,losses:29,bestTrade:321881,fomo:87,diamond:79,sniper:82,trades:116,followers:6110,level:68,xp:640228,badges:["BASE OG","FOMO RUNNER"]},
 {wallet:"demo:fartman",displayName:"Fartman Sacks",handle:"@FartmanSacks",avatar:"https://api.dicebear.com/9.x/shapes/svg?seed=FartmanSacks",chain:"solana",pnl:883932.85,unrealized:118300,volume:6900000,wins:79,losses:24,bestTrade:289410,fomo:84,diamond:96,sniper:76,trades:103,followers:5020,level:64,xp:588020,badges:["DIAMOND HANDS","HOLDER"]},
 {wallet:"demo:wood",displayName:"Wood",handle:"@notanicecat69",avatar:"https://api.dicebear.com/9.x/shapes/svg?seed=Wood",chain:"solana",pnl:739728.51,unrealized:155820,volume:5800000,wins:72,losses:27,bestTrade:240822,fomo:81,diamond:89,sniper:83,trades:99,followers:4380,level:59,xp:540180,badges:["CAT LORD","HODLER"]},
 {wallet:"demo:mofo",displayName:"m0f0",handle:"@m0f0",avatar:"https://api.dicebear.com/9.x/shapes/svg?seed=m0f0",chain:"solana",pnl:690347.44,unrealized:62000,volume:4900000,wins:64,losses:25,bestTrade:212909,fomo:93,diamond:71,sniper:88,trades:89,followers:3970,level:56,xp:498300,badges:["DEGEN","FOMO RUNNER"]},
 {wallet:"demo:picadura",displayName:"picadura",handle:"@picadura",avatar:"https://api.dicebear.com/9.x/shapes/svg?seed=picadura",chain:"ethereum",pnl:660844.27,unrealized:90440,volume:4100000,wins:61,losses:21,bestTrade:180420,fomo:79,diamond:83,sniper:80,trades:82,followers:3440,level:54,xp:462920,badges:["CT VETERAN","DEFI"]},
 {wallet:"demo:lp1",displayName:"LP 1",handle:"@LP111",avatar:"https://api.dicebear.com/9.x/shapes/svg?seed=LP1",chain:"base",pnl:605993.74,unrealized:43890,volume:3700000,wins:58,losses:19,bestTrade:154820,fomo:74,diamond:92,sniper:72,trades:77,followers:2910,level:51,xp:430110,badges:["LIQUIDITY","DIAMOND HANDS"]},
 {wallet:"demo:inyourwalls",displayName:"inyourwalls",handle:"@inyourwalls",avatar:"https://api.dicebear.com/9.x/shapes/svg?seed=inyourwalls",chain:"bnb",pnl:589888.23,unrealized:52010,volume:3400000,wins:54,losses:23,bestTrade:139440,fomo:76,diamond:81,sniper:78,trades:77,followers:2650,level:49,xp:401220,badges:["BNB OG","DEGEN"]}
];

export function demoPlayers(){ return DEMO_PLAYERS; }
