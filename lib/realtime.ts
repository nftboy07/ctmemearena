import Redis from "ioredis";

let publisher: Redis | null = null;
export const REALTIME_CHANNEL = "ctarena:events";

function getPublisher() {
  if (!process.env.REDIS_URL) return null;
  if (!publisher) publisher = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false });
  return publisher;
}

export async function publishArenaEvent(event: Record<string, unknown>) {
  const client = getPublisher();
  if (!client) return false;
  try { if (client.status === "wait") await client.connect(); await client.publish(REALTIME_CHANNEL, JSON.stringify(event)); return true; }
  catch { return false; }
}
