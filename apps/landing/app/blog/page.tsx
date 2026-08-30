import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "../../src/components/Footer";
import { Header } from "../../src/components/Header";
import { Button } from "../../src/components/ui/button";

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
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Novos conteúdos em breve
            </h2>
            <p className="mt-4 text-gray-600">
              Estamos preparando materiais para ajudar síndicos,
              administradoras e moradores a conduzir assembleias mais seguras,
              transparentes e eficientes.
            </p>
            <Button asChild className="mt-8">
              <Link href="https://www.allecto.app/#precos">
                Conhecer os planos da Allecto
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
