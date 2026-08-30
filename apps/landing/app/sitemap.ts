import type { MetadataRoute } from "next";
import { BLOG_ARTICLES, BLOG_ORIGIN } from "../src/blog/content";

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
    { url: "https://blog.allecto.app/", changeFrequency: "weekly", priority: 0.8 },
    { url: "https://blog.allecto.app/pt/gestao-de-documentos", changeFrequency: "monthly", priority: 0.7 },
    { url: "https://blog.allecto.app/pt/governanca-condominial", changeFrequency: "monthly", priority: 0.6 },
    { url: "https://blog.allecto.app/pt/seguranca-e-criptografia", changeFrequency: "monthly", priority: 0.6 },
    ...BLOG_ARTICLES.map((article) => ({ url: `${BLOG_ORIGIN}${article.canonicalPath}`, lastModified: article.modifiedAt, changeFrequency: "yearly" as const, priority: 0.8 })),
  ];
}
