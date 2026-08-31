import type { Metadata } from "next";
import React from "react";
import { CookieConsentBanner } from "../../src/components/CookieConsentBanner";
import { FAQAccordion } from "../../src/components/FAQ";
import { Footer } from "../../src/components/Footer";
import { Header } from "../../src/components/Header";
import {
  buildFaqJsonLd,
  FAQ_CATEGORIES,
  FAQ_ITEMS,
} from "../../src/content/faq";

export const metadata: Metadata = {
  title: "Perguntas Frequentes sobre Assembleias Condominiais | Allecto",
  description:
    "Tire dúvidas sobre assembleias online, votação por unidade, acesso de moradores, documentos, planos, segurança e suporte da Allecto.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Perguntas Frequentes | Allecto",
    description:
      "Respostas sobre assembleias condominiais online, participantes, documentos, planos e segurança.",
    url: "https://www.allecto.app/faq",
    siteName: "Allecto App",
    locale: "pt_BR",
    type: "website",
  },
};

export default function FaqPage() {
  const jsonLd = buildFaqJsonLd();

  return (
    <div className="min-h-screen bg-white font-inter">
      <Header />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <header className="mb-14 text-center">
              <h1 className="text-4xl tracking-tight text-gray-900 md:text-5xl">
                Perguntas frequentes
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">
                Encontre respostas sobre contratação, organização de
                assembleias e acesso dos participantes.
              </p>
            </header>

            <div className="space-y-12">
              {FAQ_CATEGORIES.map((category) => {
                const items = FAQ_ITEMS.filter(
                  (item) => item.category === category.id,
                );

                return (
                  <section
                    key={category.id}
                    aria-labelledby={`faq-${category.id}`}
                  >
                    <h2
                      id={`faq-${category.id}`}
                      className="mb-4 text-xl font-semibold text-gray-900"
                    >
                      {category.label}
                    </h2>
                    <FAQAccordion items={items} />
                  </section>
                );
              })}
            </div>

            <div className="mt-16 rounded-2xl bg-gray-50 px-6 py-8 text-center sm:px-10">
              <h2 className="text-2xl text-gray-900">Ainda tem alguma dúvida?</h2>
              <p className="mx-auto mt-2 max-w-2xl text-gray-600">
                Conte um pouco sobre o seu condomínio ou administradora e nossa
                equipe ajuda a identificar a modalidade adequada.
              </p>
              <a
                href="/#contato"
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Falar com a equipe
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <CookieConsentBanner />
    </div>
  );
}
