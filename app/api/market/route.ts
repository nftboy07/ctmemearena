import { NextResponse } from "next/server";
import { demoProvider } from "@/lib/providers";
export async function GET(){return NextResponse.json({data:await demoProvider.trending(),source:demoProvider.name});}
