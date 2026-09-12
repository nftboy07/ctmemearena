import Redis from "ioredis";
import { NextResponse } from "next/server";
import { REALTIME_CHANNEL } from "@/lib/realtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.REDIS_URL) return NextResponse.json({ error: "REDIS_URL is not configured" }, { status: 503 });
  const encoder = new TextEncoder();
  const subscriber = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const close = () => { if (closed) return; closed = true; try { controller.close(); } catch {} subscriber.disconnect(); };
      subscriber.subscribe(REALTIME_CHANNEL).then(() => controller.enqueue(encoder.encode(`event: ready\ndata: ${JSON.stringify({ channel: REALTIME_CHANNEL })}\n\n`))).catch(close);
      subscriber.on("message", (_channel, message) => { if (!closed) controller.enqueue(encoder.encode(`data: ${message}\n\n`)); });
      const heartbeat = setInterval(() => { if (!closed) controller.enqueue(encoder.encode(`: heartbeat\n\n`)); }, 15000);
      setTimeout(() => { clearInterval(heartbeat); close(); }, 25 * 60 * 1000);
    },
    cancel() { subscriber.disconnect(); },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" } });
}
