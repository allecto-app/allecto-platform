import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import type { BlogArticle, BlogCategory } from "./content";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function BlogBreadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <nav aria-label="Breadcrumb" className="text-sm text-gray-600"><ol className="flex flex-wrap items-center gap-2">{items.map((item, index) => <li key={item.label} className="flex items-center gap-2">{index > 0 && <span aria-hidden="true">/</span>}{item.href ? <Link className="hover:text-primary" href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</li>)}</ol></nav>;
}

export function ArticleCard({ article, category }: { article: BlogArticle; category: BlogCategory }) {
  return <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-primary/30 hover:shadow-md">
    <p className="text-sm font-semibold text-primary">{category.name}</p>
    <h2 className="mt-3 text-2xl font-semibold text-gray-900"><Link href={article.canonicalPath}>{article.title}</Link></h2>
    <p className="mt-3 text-gray-600">{article.summary}</p>
    <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-500"><time dateTime={article.publishedAt}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(article.publishedAt))}</time><span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{article.readingMinutes} min de leitura</span></div>
    <Link href={article.canonicalPath} className="mt-6 inline-flex items-center gap-2 font-medium text-primary hover:text-accent">Ler artigo <ArrowRight className="h-4 w-4" /></Link>
  </article>;
}

export function BlogCta({ category }: { category: BlogCategory }) {
  return <section className="rounded-3xl bg-gradient-to-br from-primary via-accent to-primary px-6 py-12 text-center text-white sm:px-10">
    <h2 className="text-3xl">{category.ctaTitle}</h2><p className="mx-auto mt-4 max-w-2xl text-white/90">{category.ctaCopy}</p>
    <Button asChild size="lg" className="mt-7 bg-white text-primary hover:bg-white/90"><Link href="https://www.allecto.app/#recursos">{category.ctaLabel}</Link></Button>
  </section>;
}
