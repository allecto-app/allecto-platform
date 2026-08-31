import type { MetadataRoute } from "next";
import { BLOG_ARTICLES, BLOG_CATEGORIES, BLOG_ORIGIN } from "../src/blog/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const blogLastModified = BLOG_ARTICLES.reduce(
    (latest, article) => article.modifiedAt > latest ? article.modifiedAt : latest,
    BLOG_ARTICLES[0]?.modifiedAt ?? "2026-08-30",
  );

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
      url: "https://www.allecto.app/faq",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://portal.allecto.app/",
      changeFrequency: "monthly",
      priority: 0.5,
    },
    { url: `${BLOG_ORIGIN}/`, lastModified: blogLastModified, changeFrequency: "weekly", priority: 0.8 },
    ...BLOG_CATEGORIES.map((category) => ({ url: `${BLOG_ORIGIN}/pt/${category.slug}`, lastModified: blogLastModified, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...BLOG_ARTICLES.map((article) => ({ url: `${BLOG_ORIGIN}${article.canonicalPath}`, lastModified: article.modifiedAt, changeFrequency: "yearly" as const, priority: 0.8 })),
  ];
}
