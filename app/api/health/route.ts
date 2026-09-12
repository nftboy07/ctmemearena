import { NextResponse } from "next/server";
import { providerConfig } from "@/lib/providers";
export async function GET(){return NextResponse.json({status:"ok",app:"ct-meme-arena",mode:"demo",providers:providerConfig});}
