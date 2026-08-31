import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Billing } from "@allecto-app/contracts";
import { describe, expect, it } from "vitest";
import FaqPage, { metadata as faqMetadata } from "../app/faq/page";
import sitemap from "../app/sitemap";
import {
  buildFaqJsonLd,
  FAQ_CATEGORIES,
  FAQ_ITEMS,
  HOME_FAQ_ITEMS,
} from "../src/content/faq";

const landingRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const faqSource = readFileSync(
  join(landingRoot, "src/components/FAQ.tsx"),
  "utf8",
);
const faqPageSource = readFileSync(
  join(landingRoot, "app/faq/page.tsx"),
  "utf8",
);

describe("landing FAQ", () => {
  it("contains 10–14 unique, categorized questions", () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(10);
    expect(FAQ_ITEMS.length).toBeLessThanOrEqual(14);
    expect(new Set(FAQ_ITEMS.map(({ id }) => id)).size).toBe(FAQ_ITEMS.length);
    expect(new Set(FAQ_ITEMS.map(({ question }) => question)).size).toBe(
      FAQ_ITEMS.length,
    );

    const categoryIds = new Set(FAQ_CATEGORIES.map(({ id }) => id));
    for (const item of FAQ_ITEMS) expect(categoryIds.has(item.category)).toBe(true);
    for (const category of FAQ_CATEGORIES) {
      expect(FAQ_ITEMS.some((item) => item.category === category.id)).toBe(true);
    }
  });

  it("keeps visible answers and FAQPage structured data in parity", () => {
    const jsonLd = buildFaqJsonLd();
    expect(jsonLd["@type"]).toBe("FAQPage");
    expect(jsonLd.mainEntity).toHaveLength(FAQ_ITEMS.length);
    expect(jsonLd.mainEntity.map(({ name }) => name)).toEqual(
      FAQ_ITEMS.map(({ question }) => question),
    );
    expect(jsonLd.mainEntity.map(({ acceptedAnswer }) => acceptedAnswer.text)).toEqual(
      FAQ_ITEMS.map(({ answer }) => answer),
    );
  });

  it("shows only three high-intent questions on the homepage", () => {
    expect(HOME_FAQ_ITEMS.map(({ id }) => id)).toEqual([
      "o-que-e-allecto",
      "assembleia-avulsa",
      "acesso-sem-aplicativo",
    ]);
    expect(buildFaqJsonLd(HOME_FAQ_ITEMS).mainEntity).toHaveLength(3);
    expect(faqSource).toContain('href="/faq"');
  });

  it("publishes the complete FAQ as a canonical, single-column page", () => {
    expect(FaqPage()).toBeTruthy();
    expect(faqMetadata.alternates?.canonical).toBe("/faq");
    expect(sitemap().map(({ url }) => url)).toContain(
      "https://www.allecto.app/faq",
    );
    expect(faqPageSource).not.toMatch(/grid-cols-[2-9]/);
    expect(faqPageSource).toContain('className="space-y-12"');
    expect(faqPageSource).toContain("FAQ_CATEGORIES.map");
  });

  it("derives current commercial names, prices and limits from billing contracts", () => {
    const copy = FAQ_ITEMS.map(({ question, answer }) => `${question} ${answer}`).join(" ");
    for (const plan of Billing.COMMERCIAL_OFFERS) expect(copy).toContain(plan.name);
    for (const plan of Billing.BILLING_PLANS) expect(copy).toContain(plan.priceLabel);
    expect(copy).not.toMatch(/\b(?:Plus|Pro)\b/);
    expect(copy).not.toContain("A partir de");
  });

  it("does not repeat the unsupported claims removed from the old FAQ", () => {
    const answers = FAQ_ITEMS.map(({ answer }) => answer).join(" ").toLowerCase();
    expect(answers).not.toContain("garante validade");
    expect(answers).not.toContain("criptografia de ponta a ponta");
    expect(answers).not.toContain("autenticação de múltiplos fatores");
    expect(answers).not.toContain("voto anônimo");
  });

  it("uses accessible accordion and link interaction primitives", () => {
    expect(faqSource).toContain('type="single"');
    expect(faqSource).toContain("collapsible");
    expect(faqSource).toContain("AccordionTrigger");
    expect(faqSource).toContain("AccordionContent");
    expect(faqSource).toContain("focus-visible:ring-2");
    expect(faqPageSource).toContain('aria-labelledby={`faq-${category.id}`}');
    expect(faqSource).toContain("last:border-b");
  });
});
