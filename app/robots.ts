import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://ctmemearena.com";
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/_next/"] }, sitemap: `${base.replace(/\/$/, "")}/sitemap.xml` };
}
