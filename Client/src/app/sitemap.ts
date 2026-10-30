import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return ["", "/story", "/chapters", "/archive", "/about"].map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: "monthly",
    priority: path ? 0.7 : 1,
  }));
}
