import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import sitemap from "../app/sitemap";
import CategoryPage, { generateMetadata as generateCategoryMetadata } from "../app/pt/[category]/page";
import DocumentPolicyArticlePage, { metadata as articleMetadata } from "../app/pt/gestao-de-documentos/modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance/page";
import { BLOG_CATEGORIES, DOCUMENT_POLICY_ARTICLE, DOCUMENT_POLICY_JSON_LD, getArticlesByCategory } from "../src/blog/content";

const landingRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const articleSource = readFileSync(join(landingRoot, "app/pt/gestao-de-documentos/modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance/page.tsx"), "utf8");
const nextConfigSource = readFileSync(join(landingRoot, "next.config.js"), "utf8");
const packageSource = readFileSync(join(landingRoot, "package.json"), "utf8");

describe("restored blog content", () => {
  it("publishes all three category routes from the content index", () => {
    expect(BLOG_CATEGORIES.map(({ slug }) => slug)).toEqual([
      "gestao-de-documentos",
      "governanca-condominial",
      "seguranca-e-criptografia",
    ]);

    for (const category of BLOG_CATEGORIES) {
      expect(CategoryPage({ params: { category: category.slug } })).toBeTruthy();
      expect(generateCategoryMetadata({ params: { category: category.slug } }).alternates?.canonical).toBe(
        `https://blog.allecto.app/pt/${category.slug}`,
      );
    }
  });

  it("links the document article only from its canonical category", () => {
    expect(getArticlesByCategory("gestao-de-documentos")).toEqual([DOCUMENT_POLICY_ARTICLE]);
    expect(DOCUMENT_POLICY_ARTICLE.canonicalPath).toMatch(/^\/pt\/gestao-de-documentos\//);
  });

  it("renders one article H1 and valid JSON-LD serialization", () => {
    expect(DocumentPolicyArticlePage()).toBeTruthy();
    expect(articleSource.match(/<h1\b/g)).toHaveLength(1);
    expect(articleMetadata.alternates?.canonical).toBe(`https://blog.allecto.app${DOCUMENT_POLICY_ARTICLE.canonicalPath}`);
    expect(JSON.parse(JSON.stringify(DOCUMENT_POLICY_JSON_LD))["@type"]).toBe("BlogPosting");
  });

  it("declares the direct permanent legacy redirect", () => {
    expect(nextConfigSource).toContain("/pt/modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance");
    expect(nextConfigSource).toContain(DOCUMENT_POLICY_ARTICLE.canonicalPath);
    expect(nextConfigSource).toContain("permanent: true");
  });

  it("includes canonical pages and excludes the duplicate from the sitemap", () => {
    const urls = sitemap().map(({ url }) => url);
    for (const category of BLOG_CATEGORIES) expect(urls).toContain(`https://blog.allecto.app/pt/${category.slug}`);
    expect(urls).toContain(`https://blog.allecto.app${DOCUMENT_POLICY_ARTICLE.canonicalPath}`);
    expect(urls).not.toContain("https://blog.allecto.app/pt/modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance");
  });

  it("contains no Ranklayer integration", () => {
    expect(articleSource.toLowerCase()).not.toContain("ranklayer");
    expect(packageSource.toLowerCase()).not.toContain("ranklayer");
  });
});
