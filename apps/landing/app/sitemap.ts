import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.allecto.app/",
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.allecto.app/politica-de-privacidade",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://portal.allecto.app/",
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
