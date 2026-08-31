import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import {
  buildFaqJsonLd,
  HOME_FAQ_ITEMS,
  type FaqItem,
} from "../content/faq";

export function FAQAccordion({ items }: { items: readonly FaqItem[] }) {
  return (
    <Accordion type="single" collapsible className="space-y-3">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="rounded-lg border border-gray-200 bg-white px-5 transition-colors last:border-b hover:border-primary/40"
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
  );
}

export function FAQ() {
  const jsonLd = buildFaqJsonLd(HOME_FAQ_ITEMS);

  return (
    <section className="py-24 bg-white" id="faq">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl tracking-tight text-gray-900 mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-xl text-gray-600">
            Respostas objetivas para escolher e usar a Allecto com segurança.
          </p>
        </div>

        <FAQAccordion items={HOME_FAQ_ITEMS} />

        <div className="mt-8 text-center">
          <a
            href="/faq"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary px-6 py-3 font-medium text-primary transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Ver todas as perguntas
          </a>
        </div>
      </div>
    </section>
  );
}
