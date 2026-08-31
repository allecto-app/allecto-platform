import type { Metadata } from "next";
import React from "react";
import { notFound } from "next/navigation";
import { Footer } from "../../../src/components/Footer";
import { Header } from "../../../src/components/Header";
import { ArticleCard, BlogBreadcrumbs, BlogCta, JsonLd } from "../../../src/blog/BlogUi";
import { BLOG_CATEGORIES, BLOG_ORIGIN, getArticlesByCategory, getCategory } from "../../../src/blog/content";

type Props = { params: { category: string } };
export function generateStaticParams() { return BLOG_CATEGORIES.map(({ slug }) => ({ category: slug })); }
export function generateMetadata({ params }: Props): Metadata {
  const category = getCategory(params.category); if (!category) return {};
  const canonical = `${BLOG_ORIGIN}/pt/${category.slug}`;
  return { title: category.title, description: category.description, alternates: { canonical }, openGraph: { title: category.title, description: category.description, url: canonical, siteName: "Blog Allecto", locale: "pt_BR", type: "website" }, twitter: { card: "summary_large_image", title: category.title, description: category.description } };
}
export default function CategoryPage({ params }: Props) {
  const category = getCategory(params.category); if (!category) notFound();
  const articles = getArticlesByCategory(category.slug); const canonical = `${BLOG_ORIGIN}/pt/${category.slug}`;
  const breadcrumbs = [{ label: "Início", href: `${BLOG_ORIGIN}/` }, { label: category.name }];
  return <div className="min-h-screen bg-gray-50"><Header /><main><JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbs.map((item, position) => ({ "@type": "ListItem", position: position + 1, name: item.label, item: item.href ?? canonical })) }} /><JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: category.heading, description: category.description, url: canonical, inLanguage: "pt-BR" }} />
    <section className="bg-white py-16"><div className="mx-auto max-w-5xl px-4 sm:px-6"><BlogBreadcrumbs items={breadcrumbs} /><h1 className="mt-8 text-4xl tracking-tight text-gray-900 md:text-5xl">{category.heading}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-gray-600">{category.intro}</p><ul className="mt-8 flex flex-wrap gap-2">{category.themes.map((theme) => <li key={theme} className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">{theme}</li>)}</ul></div></section>
    <section className="py-16"><div className="mx-auto max-w-5xl px-4 sm:px-6"><h2 className="text-2xl font-semibold text-gray-900">Artigos publicados</h2><div className="mt-8 grid gap-[30px]">{articles.length ? articles.map((article) => <ArticleCard key={article.slug} article={article} category={category} />) : <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">Ainda não há artigos publicados nesta categoria. Novos conteúdos serão adicionados em breve.</p>}</div><div className="mt-16"><BlogCta category={category} /></div><nav aria-label="Outras categorias" className="mt-12"><h2 className="text-lg font-semibold text-gray-900">Explore também</h2><div className="mt-4 flex flex-wrap gap-3">{BLOG_CATEGORIES.filter(({ slug }) => slug !== category.slug).map((item) => <LinkChip key={item.slug} href={`${BLOG_ORIGIN}/pt/${item.slug}`} label={item.name} />)}</div></nav></div></section>
  </main><Footer /></div>;
}
function LinkChip({ href, label }: { href: string; label: string }) { return <a href={href} className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:border-primary hover:text-primary">{label}</a>; }
