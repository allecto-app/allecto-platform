import React, { type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { BlogBreadcrumbs, JsonLd } from "./BlogUi";
import { BLOG_ORIGIN, getArticle, getCategory, type BlogArticle } from "./content";

export type ArticleSource = { label: string; href: string };
export type ArticleContent = {
  directAnswer: string;
  sections: Array<{ id: string; label: string }>;
  body: ReactNode;
  sources: ArticleSource[];
  related: string[];
  ctaLabel: string;
};

export const LEGAL_DISCLAIMER = "Este conteúdo tem caráter informativo e não substitui a análise da convenção do condomínio nem a orientação de profissionais jurídicos, contábeis ou de proteção de dados.";

function formatPublishedDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(date));
}

export function buildArticleJsonLd(article: BlogArticle) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    inLanguage: "pt-BR",
    mainEntityOfPage: `${BLOG_ORIGIN}${article.canonicalPath}`,
    datePublished: article.publishedAt,
    dateModified: article.modifiedAt,
    wordCount: article.wordCount,
    author: { "@type": "Organization", name: article.author, url: "https://www.allecto.app/" },
    reviewedBy: { "@type": "Organization", name: article.reviewer },
    publisher: { "@type": "Organization", name: "Allecto", url: "https://www.allecto.app/", logo: { "@type": "ImageObject", url: "https://www.allecto.app/images/logo-allecto.png" } },
    image: { "@type": "ImageObject", url: `${BLOG_ORIGIN}${article.imagePath}`, caption: article.imageAlt },
  };
}

export function ArticlePage({ article, content }: { article: BlogArticle; content: ArticleContent }) {
  const category = getCategory(article.categorySlug)!;
  const canonical = `${BLOG_ORIGIN}${article.canonicalPath}`;
  const breadcrumbs = [
    { label: "Início", href: `${BLOG_ORIGIN}/` },
    { label: category.name, href: `${BLOG_ORIGIN}/pt/${category.slug}` },
    { label: article.title },
  ];
  const related = content.related.map((path) => getArticle(...path.replace(/^\/pt\//, "").split("/") as [string, string])).filter((item): item is BlogArticle => Boolean(item));

  return <div className="min-h-screen bg-white"><Header /><main>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbs.map((item, position) => ({ "@type": "ListItem", position: position + 1, name: item.label, item: item.href ?? canonical })) }} />
    <JsonLd data={buildArticleJsonLd(article)} />
    <article className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <BlogBreadcrumbs items={breadcrumbs} />
      <header className="mt-8 border-b border-gray-200 pb-10">
        <p className="font-semibold text-primary">{category.name}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">{article.title}</h1>
        <p className="mt-6 text-xl leading-8 text-gray-600">{article.summary}</p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-500"><span>Por {article.author}</span><span>Revisão: {article.reviewer}</span><time dateTime={article.publishedAt}>Publicado em {formatPublishedDate(article.publishedAt)}</time><span>{article.readingMinutes} min de leitura</span></div>
        <Image className="mt-8 h-auto w-full rounded-2xl border border-gray-200" src={article.imagePath} width={1200} height={630} priority alt={article.imageAlt} />
      </header>
      <div className="prose prose-lg max-w-none py-10 text-gray-700 [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mt-14 [&_h2]:scroll-mt-24 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:mt-9 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_li]:mt-2 [&_p]:mt-5 [&_p]:leading-8">
        <aside className="rounded-xl border-l-4 border-primary bg-primary/5 p-5"><strong>Resposta direta:</strong> {content.directAnswer}</aside>
        <nav aria-label="Sumário" className="my-10 rounded-2xl border bg-gray-50 p-6"><h2 className="!mt-0 text-xl">Neste guia</h2><ol className="mt-4 grid gap-2 sm:grid-cols-2">{content.sections.map((section) => <li key={section.id}><a href={`#${section.id}`}>{section.label}</a></li>)}</ol></nav>
        <aside className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-5"><strong>Aviso:</strong> {LEGAL_DISCLAIMER}</aside>
        {content.body}
        <aside className="my-12 rounded-2xl bg-primary p-8 text-white"><h2 className="!mt-0 !text-white">Leve a organização da assembleia para um fluxo digital</h2><p>Conheça os recursos e escolha entre os planos Avulso, Essencial, Gestão, Administradora e Enterprise conforme a realidade do condomínio.</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild className="bg-white text-primary hover:bg-white/90"><Link href="https://www.allecto.app/#precos">{content.ctaLabel}</Link></Button><Button asChild variant="outline" className="border-white bg-transparent text-white hover:bg-white/10"><Link className="!text-white !no-underline hover:!text-white" href="https://www.allecto.app/">Conhecer a Allecto</Link></Button></div></aside>
        <section aria-labelledby="related-title"><h2 id="related-title">Conteúdos relacionados</h2><ul>{related.map((item) => <li key={item.slug}><Link href={`${BLOG_ORIGIN}${item.canonicalPath}`}>{item.title}</Link></li>)}<li><Link href={`${BLOG_ORIGIN}/pt/${category.slug}`}>Ver todos os conteúdos de {category.name}</Link></li></ul></section>
        <section aria-labelledby="sources-title"><h2 id="sources-title">Fontes consultadas</h2><ul>{content.sources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul><p className="text-sm">Consulta realizada em 30 de agosto de 2026. Normas e orientações podem ser atualizadas; confirme sempre a versão vigente.</p></section>
      </div>
    </article>
  </main><Footer /></div>;
}
