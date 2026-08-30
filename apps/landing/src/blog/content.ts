export const BLOG_ORIGIN = "https://blog.allecto.app";

export type BlogCategory = {
  slug: string;
  name: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  themes: string[];
  ctaTitle: string;
  ctaCopy: string;
  ctaLabel: string;
};

export type BlogArticle = {
  slug: string;
  categorySlug: string;
  title: string;
  seoTitle: string;
  description: string;
  summary: string;
  publishedAt: string;
  modifiedAt: string;
  author: string;
  readingMinutes: number;
  canonicalPath: string;
};

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: "gestao-de-documentos",
    name: "Gestão de Documentos",
    title: "Gestão de Documentos para Condomínios | Allecto",
    description: "Guias, modelos e boas práticas para organizar, armazenar, proteger e definir a retenção de documentos condominiais.",
    heading: "Gestão de documentos para condomínios",
    intro: "Organizar atas, editais, procurações, contratos, comprovantes e relatórios é parte essencial da administração condominial. Encontre guias e modelos para estruturar documentos, definir responsabilidades, controlar acessos e preservar o histórico do condomínio.",
    themes: ["Organização documental", "Retenção e descarte", "Controle de acesso", "Continuidade administrativa"],
    ctaTitle: "Centralize os documentos das suas assembleias",
    ctaCopy: "Conheça uma forma mais organizada de disponibilizar pautas, anexos, registros de votação, relatórios e atas.",
    ctaLabel: "Conhecer a Allecto",
  },
  {
    slug: "governanca-condominial",
    name: "Governança Condominial",
    title: "Governança Condominial: Guias para Síndicos | Allecto",
    description: "Conteúdos sobre transparência, prestação de contas, assembleias, decisões coletivas e boas práticas de governança condominial.",
    heading: "Governança condominial",
    intro: "Uma boa governança ajuda o condomínio a tomar decisões mais transparentes, documentadas e participativas. Nesta seção, reunimos orientações para síndicos, conselhos e administradoras sobre assembleias, prestação de contas, responsabilidades e comunicação com os condôminos.",
    themes: ["Transparência e prestação de contas", "Participação e assembleias", "Quórum e registro de decisões", "Conselhos, responsabilidades e conflitos", "Proteção de informações"],
    ctaTitle: "Decisões mais organizadas e rastreáveis",
    ctaCopy: "Veja como organizar convocações, documentos, votações, atas e relatórios em um fluxo único para a assembleia.",
    ctaLabel: "Ver como a Allecto funciona",
  },
  {
    slug: "seguranca-e-criptografia",
    name: "Segurança e Criptografia",
    title: "Segurança Digital em Condomínios | Allecto",
    description: "Boas práticas de segurança, controle de acesso, proteção de dados e privacidade na gestão digital de condomínios.",
    heading: "Segurança e proteção de dados em condomínios",
    intro: "A digitalização da gestão condominial exige cuidados com acesso, compartilhamento, armazenamento e tratamento de dados pessoais. Veja boas práticas para reduzir riscos e tornar os processos digitais mais seguros.",
    themes: ["Controle de acesso, senhas fortes e MFA", "Permissões e minimização de dados", "Compartilhamento seguro e backups", "Resposta a incidentes e phishing", "Logs, LGPD, retenção e descarte seguro"],
    ctaTitle: "Proteja o histórico das decisões do condomínio",
    ctaCopy: "Conheça recursos para restringir documentos por perfil e manter os registros da assembleia associados ao condomínio.",
    ctaLabel: "Conhecer os recursos de segurança",
  },
];

export function calculateReadingMinutes(words: number) {
  return Math.max(1, Math.ceil(words / 200));
}

export const DOCUMENT_POLICY_ARTICLE: BlogArticle = {
  slug: "modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance",
  categorySlug: "gestao-de-documentos",
  title: "Modelo de política de gestão e retenção de documentos do condomínio",
  seoTitle: "Política de Gestão e Retenção de Documentos do Condomínio: Modelo e Checklist",
  description: "Descubra uma política de gestão e retenção de documentos do condomínio com modelos editáveis e checklist de compliance. Baixe e implemente hoje.",
  summary: "Um guia prático para inventariar documentos, definir responsabilidades, construir uma tabela de temporalidade e adaptar um modelo de política à realidade do condomínio.",
  publishedAt: "2026-04-20",
  modifiedAt: "2026-08-30",
  author: "Equipe Allecto",
  // Counted from the final server-rendered editorial copy (excluding navigation and schema).
  readingMinutes: calculateReadingMinutes(2524),
  canonicalPath: "/pt/gestao-de-documentos/modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance",
};

export const DOCUMENT_POLICY_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: DOCUMENT_POLICY_ARTICLE.title,
  description: DOCUMENT_POLICY_ARTICLE.description,
  inLanguage: "pt-BR",
  mainEntityOfPage: `${BLOG_ORIGIN}${DOCUMENT_POLICY_ARTICLE.canonicalPath}`,
  datePublished: DOCUMENT_POLICY_ARTICLE.publishedAt,
  dateModified: DOCUMENT_POLICY_ARTICLE.modifiedAt,
  author: { "@type": "Organization", name: DOCUMENT_POLICY_ARTICLE.author, url: "https://www.allecto.app/" },
  publisher: { "@type": "Organization", name: "Allecto", url: "https://www.allecto.app/", logo: { "@type": "ImageObject", url: "https://www.allecto.app/images/logo-allecto.png" } },
  image: "https://www.allecto.app/images/og/landing-1200x630.png",
  articleSection: "Gestão de Documentos",
};

export const BLOG_ARTICLES = [DOCUMENT_POLICY_ARTICLE];
export const getCategory = (slug: string) => BLOG_CATEGORIES.find((category) => category.slug === slug);
export const getArticlesByCategory = (slug: string) => BLOG_ARTICLES.filter((article) => article.categorySlug === slug);
