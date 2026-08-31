import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  buildFaqJsonLd,
  FAQ_CATEGORIES,
  FAQ_ITEMS,
} from "../content/faq";

export function FAQ() {
  const jsonLd = buildFaqJsonLd();

  return (
    <section className="py-24 bg-white" id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl tracking-tight text-gray-900 mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-xl text-gray-600">
            Respostas objetivas para escolher e usar a Allecto com segurança.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          {FAQ_CATEGORIES.map((category) => {
            const items = FAQ_ITEMS.filter(
              (item) => item.category === category.id,
            );

            return (
              <section key={category.id} aria-labelledby={`faq-${category.id}`}>
                <h3
                  id={`faq-${category.id}`}
                  className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary"
                >
                  {category.label}
                </h3>
                <Accordion type="single" collapsible className="space-y-3">
                  {items.map((item) => (
                    <AccordionItem
                      key={item.id}
                      value={item.id}
                      className="rounded-lg border border-gray-200 bg-white px-5 transition-colors hover:border-primary/40"
                    >
                      <AccordionTrigger className="text-left text-base text-gray-900 hover:text-primary hover:no-underline">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 text-base leading-7 text-gray-600">
                        <p>{item.answer}</p>
                        {item.link ? (
                          <a
                            className="mt-3 inline-flex rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            href={item.link.href}
                          >
                            {item.link.label}
                          </a>
                        ) : null}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            );
          })}
        </div>

        <div className="mt-14 rounded-2xl bg-gray-50 px-6 py-8 text-center sm:px-10">
          <h3 className="text-2xl text-gray-900">Ainda tem alguma dúvida?</h3>
          <p className="mx-auto mt-2 max-w-2xl text-gray-600">
            Conte um pouco sobre o seu condomínio ou administradora e nossa
            equipe ajuda a identificar a modalidade adequada.
          </p>
          <a
            href="#contato"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Falar com a equipe
          </a>
        </div>
      </div>
    </section>
  );
}
