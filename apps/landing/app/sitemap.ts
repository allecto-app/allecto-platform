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
    { url: "https://blog.allecto.app/", changeFrequency: "weekly", priority: 0.8 },
    { url: "https://blog.allecto.app/pt/gestao-de-documentos", changeFrequency: "monthly", priority: 0.7 },
    { url: "https://blog.allecto.app/pt/governanca-condominial", changeFrequency: "monthly", priority: 0.6 },
    { url: "https://blog.allecto.app/pt/seguranca-e-criptografia", changeFrequency: "monthly", priority: 0.6 },
    { url: "https://blog.allecto.app/pt/gestao-de-documentos/modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance", lastModified: "2026-08-30", changeFrequency: "yearly", priority: 0.8 },
  ];
}
