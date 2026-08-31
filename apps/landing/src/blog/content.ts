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
  reviewer: string;
  wordCount: number;
  readingMinutes: number;
  canonicalPath: string;
  imagePath: string;
  imageAlt: string;
  imageBrief: string;
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
  reviewer: "Equipe editorial Allecto",
  wordCount: 2524,
  // Counted from the final server-rendered editorial copy (excluding navigation and schema).
  readingMinutes: calculateReadingMinutes(2524),
  canonicalPath: "/pt/gestao-de-documentos/modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance",
  imagePath: "/images/og/landing-1200x630.png",
  imageAlt: "Documentos, atas e relatórios organizados para a gestão condominial",
  imageBrief: "Mesa organizada com pastas de documentos condominiais, ata e checklist, usando a paleta azul e violeta da Allecto.",
};

const NEW_ARTICLES: BlogArticle[] = [
  {
    slug: "assembleia-condominial-online-e-valida",
    categorySlug: "governanca-condominial",
    title: "Assembleia condominial online é válida? Entenda as regras",
    seoTitle: "Assembleia Condominial Online é Válida? Veja as Regras",
    description: "Entenda quando a assembleia condominial online é válida, o que deve constar no edital e como preservar participação, voz, voto, quórum e registros.",
    summary: "Um guia sobre convocação, participação, voz, voto, quórum e registros para planejar assembleias eletrônicas com critérios claros.",
    publishedAt: "2026-08-28",
    modifiedAt: "2026-08-30",
    author: "Equipe Allecto",
    reviewer: "Equipe editorial Allecto",
    wordCount: 2243,
    readingMinutes: calculateReadingMinutes(2243),
    canonicalPath: "/pt/governanca-condominial/assembleia-condominial-online-e-valida",
    imagePath: "/images/blog/assembleia-online.svg",
    imageAlt: "Síndico conduzindo assembleia condominial online com participantes conectados",
    imageBrief: "Síndico diante de notebook com mosaico de condôminos, pauta e indicadores de voz, voto e quórum, na paleta azul e violeta da Allecto.",
  },
  {
    slug: "quorum-assembleia-condominio",
    categorySlug: "governanca-condominial",
    title: "Quórum em assembleia de condomínio: guia prático",
    seoTitle: "Quórum em Assembleia de Condomínio: Guia Prático",
    description: "Aprenda a identificar e controlar o quórum em assembleias condominiais, considerando presentes, unidades, fração ideal e tipo de deliberação.",
    summary: "Como separar instalação e deliberação, definir a base de cálculo e registrar entradas, saídas, procurações e resultados por pauta.",
    publishedAt: "2026-08-26",
    modifiedAt: "2026-08-30",
    author: "Equipe Allecto",
    reviewer: "Equipe editorial Allecto",
    wordCount: 2733,
    readingMinutes: calculateReadingMinutes(2733),
    canonicalPath: "/pt/governanca-condominial/quorum-assembleia-condominio",
    imagePath: "/images/blog/quorum.svg",
    imageAlt: "Painel de quórum condominial com unidades presentes e frações ideais",
    imageBrief: "Painel editorial com edifício, unidades, percentuais de fração ideal e medidor de quórum, seguindo o gradiente azul-violeta da Allecto.",
  },
  {
    slug: "votacao-por-fracao-ideal-condominio",
    categorySlug: "governanca-condominial",
    title: "Votação por fração ideal no condomínio: como calcular",
    seoTitle: "Votação por Fração Ideal: Como Calcular no Condomínio",
    description: "Entenda como funciona a votação por fração ideal, quando ela deve ser aplicada e como calcular os resultados de uma assembleia condominial.",
    summary: "Entenda o voto ponderado, prepare o cadastro das unidades e confira resultados sem confundir presença, quórum e peso do voto.",
    publishedAt: "2026-08-24",
    modifiedAt: "2026-08-30",
    author: "Equipe Allecto",
    reviewer: "Equipe editorial Allecto",
    wordCount: 2202,
    readingMinutes: calculateReadingMinutes(2202),
    canonicalPath: "/pt/governanca-condominial/votacao-por-fracao-ideal-condominio",
    imagePath: "/images/blog/fracao-ideal.svg",
    imageAlt: "Cálculo de votação condominial ponderada por fração ideal",
    imageBrief: "Quatro unidades de tamanhos diferentes ligadas a pesos percentuais e a um resultado de votação, na identidade visual da Allecto.",
  },
  {
    slug: "assembleia-hibrida-condominio",
    categorySlug: "governanca-condominial",
    title: "Assembleia híbrida de condomínio: como organizar passo a passo",
    seoTitle: "Assembleia Híbrida de Condomínio: Guia Passo a Passo",
    description: "Saiba como organizar uma assembleia híbrida com participação presencial e online, controle de presença, quórum, voz, votação e registros.",
    summary: "Planejamento operacional para integrar participantes presenciais e remotos sem duplicar presença, voto ou contagem de quórum.",
    publishedAt: "2026-08-21",
    modifiedAt: "2026-08-30",
    author: "Equipe Allecto",
    reviewer: "Equipe editorial Allecto",
    wordCount: 2645,
    readingMinutes: calculateReadingMinutes(2645),
    canonicalPath: "/pt/governanca-condominial/assembleia-hibrida-condominio",
    imagePath: "/images/blog/assembleia-hibrida.svg",
    imageAlt: "Assembleia híbrida com condôminos na sala e participantes online",
    imageBrief: "Sala de assembleia conectada a participantes remotos, com uma lista de presença única e fluxo de votação integrado, em azul e violeta.",
  },
  {
    slug: "lgpd-para-condominios",
    categorySlug: "seguranca-e-criptografia",
    title: "LGPD para condomínios: guia prático para síndicos",
    seoTitle: "LGPD para Condomínios: Guia Prático para Síndicos",
    description: "Veja como aplicar a LGPD no condomínio, organizar dados de moradores, controlar acessos, definir retenção e responder a incidentes e solicitações.",
    summary: "Um plano prático para mapear dados, definir responsabilidades, controlar acessos, revisar fornecedores e responder a titulares e incidentes.",
    publishedAt: "2026-08-19",
    modifiedAt: "2026-08-30",
    author: "Equipe Allecto",
    reviewer: "Equipe editorial Allecto",
    wordCount: 3064,
    readingMinutes: calculateReadingMinutes(3064),
    canonicalPath: "/pt/seguranca-e-criptografia/lgpd-para-condominios",
    imagePath: "/images/blog/lgpd-condominios.svg",
    imageAlt: "Síndico protegendo cadastros e documentos pessoais do condomínio",
    imageBrief: "Edifício cercado por camadas de proteção, com cartões de cadastro, câmera, documento e canal do titular, na identidade azul-violeta da Allecto.",
  },
];

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

export const BLOG_ARTICLES = [...NEW_ARTICLES, DOCUMENT_POLICY_ARTICLE];
export const getCategory = (slug: string) => BLOG_CATEGORIES.find((category) => category.slug === slug);
export const getArticlesByCategory = (slug: string) => BLOG_ARTICLES.filter((article) => article.categorySlug === slug);
export const getArticle = (categorySlug: string, articleSlug: string) => BLOG_ARTICLES.find((article) => article.categorySlug === categorySlug && article.slug === articleSlug);
