import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://ctmemearena.com").replace(/\/$/, "");
  return [{ url: base, changeFrequency: "hourly", priority: 1 }];
}
