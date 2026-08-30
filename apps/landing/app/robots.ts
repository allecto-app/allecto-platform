import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/checkout/",
        "/onboarding/",
        "/success/",
        "/cancel/",
        "/dashboard/",
        "/admin/",
      ],
    },
    sitemap: "https://www.allecto.app/sitemap.xml",
  };
}
