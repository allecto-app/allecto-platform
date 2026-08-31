import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "../../src/components/Footer";
import { Header } from "../../src/components/Header";
import { Button } from "../../src/components/ui/button";
import { ArticleCard } from "../../src/blog/BlogUi";
import { BLOG_ARTICLES, BLOG_CATEGORIES, BLOG_ORIGIN } from "../../src/blog/content";

export const metadata: Metadata = {
  title: "Conteúdos sobre Assembleias Condominiais | Allecto",
  description:
    "Guias sobre assembleias condominiais, votação eletrônica, quórum, procurações, fração ideal, segurança e governança.",
  alternates: { canonical: "https://blog.allecto.app/" },
  openGraph: {
    title: "Conteúdos sobre Assembleias Condominiais | Allecto",
    description:
      "Guias sobre assembleias condominiais, votação eletrônica, quórum, procurações, fração ideal, segurança e governança.",
    url: "https://blog.allecto.app/",
    siteName: "Blog Allecto",
    locale: "pt_BR",
    type: "website",
  },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <section className="bg-gradient-to-br from-primary via-accent to-primary py-24 text-white">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-secondary">
              Blog Allecto
            </p>
            <h1 className="text-4xl tracking-tight md:text-5xl">
              Conteúdos sobre assembleias e governança condominial
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-white/90">
              Guias práticos sobre assembleias condominiais, votação
              eletrônica, quórum, procurações, fração ideal, segurança e boas
              práticas de governança.
            </p>
          </div>
        </section>
        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold text-gray-900">Explore por tema</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">{BLOG_CATEGORIES.map((category) => <Link key={category.slug} href={`${BLOG_ORIGIN}/pt/${category.slug}`} className="rounded-2xl border bg-white p-6 hover:border-primary/40"><h3 className="text-xl font-semibold text-gray-900">{category.name}</h3><p className="mt-3 text-sm leading-6 text-gray-600">{category.description}</p></Link>)}</div>
            <h2 className="mt-16 text-2xl font-semibold text-gray-900">Conteúdos recentes</h2>
            <div className="mt-8 grid gap-[30px]">{BLOG_ARTICLES.map((article) => { const category = BLOG_CATEGORIES.find(({ slug }) => slug === article.categorySlug)!; return <ArticleCard key={article.slug} article={article} category={category} />; })}</div>
            <div className="mt-12 text-center"><Button asChild>
              <Link href="https://www.allecto.app/#precos">
                Conhecer os planos da Allecto
              </Link>
            </Button></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
