import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "../middleware";
import sitemap from "../app/sitemap";
import CategoryPage, { generateMetadata as generateCategoryMetadata } from "../app/pt/[category]/page";
import NewArticlePage, { generateMetadata as generateArticleMetadata } from "../app/pt/[category]/[article]/page";
import DocumentPolicyArticlePage, { metadata as articleMetadata } from "../app/pt/gestao-de-documentos/modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance/page";
import { ARTICLE_CONTENTS } from "../src/blog/articleContents";
import { buildArticleJsonLd } from "../src/blog/ArticlePage";
import { BLOG_ARTICLES, BLOG_CATEGORIES, DOCUMENT_POLICY_ARTICLE, DOCUMENT_POLICY_JSON_LD, getArticlesByCategory } from "../src/blog/content";

const landingRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const articleSource = readFileSync(join(landingRoot, "app/pt/gestao-de-documentos/modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance/page.tsx"), "utf8");
const nextConfigSource = readFileSync(join(landingRoot, "next.config.js"), "utf8");
const packageSource = readFileSync(join(landingRoot, "package.json"), "utf8");
const articleContentsSource = readFileSync(join(landingRoot, "src/blog/articleContents.tsx"), "utf8");
const articlePageSource = readFileSync(join(landingRoot, "src/blog/ArticlePage.tsx"), "utf8");
const newArticles = BLOG_ARTICLES.filter((article) => article.slug in ARTICLE_CONTENTS);

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

  it("renders all five new articles with unique canonical metadata", () => {
    expect(newArticles).toHaveLength(5);
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    const canonicals = new Set<string>();

    for (const article of newArticles) {
      const params = { category: article.categorySlug, article: article.slug };
      expect(NewArticlePage({ params })).toBeTruthy();
      const metadata = generateArticleMetadata({ params });
      expect(metadata.alternates?.canonical).toBe(`https://blog.allecto.app${article.canonicalPath}`);
      titles.add(String(metadata.title));
      descriptions.add(String(metadata.description));
      canonicals.add(String(metadata.alternates?.canonical));
      expect(JSON.parse(JSON.stringify(buildArticleJsonLd(article)))["@type"]).toBe("BlogPosting");
    }

    expect(titles.size).toBe(5);
    expect(descriptions.size).toBe(5);
    expect(canonicals.size).toBe(5);
  });

  it("uses one shared H1 and no H1 inside article bodies", () => {
    expect(articlePageSource.match(/<h1\b/g)).toHaveLength(1);
    expect(articleContentsSource).not.toMatch(/<h1\b/);
  });

  it("lists articles under the correct categories in editorial order", () => {
    expect(getArticlesByCategory("governanca-condominial").map(({ slug }) => slug)).toEqual([
      "assembleia-condominial-online-e-valida",
      "quorum-assembleia-condominio",
      "votacao-por-fracao-ideal-condominio",
      "assembleia-hibrida-condominio",
    ]);
    expect(getArticlesByCategory("seguranca-e-criptografia").map(({ slug }) => slug)).toEqual(["lgpd-para-condominios"]);
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
    for (const article of newArticles) expect(urls).toContain(`https://blog.allecto.app${article.canonicalPath}`);
    expect(urls).not.toContain("https://blog.allecto.app/pt/modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance");
  });

  it("contains no Ranklayer integration", () => {
    expect(articleSource.toLowerCase()).not.toContain("ranklayer");
    expect(packageSource.toLowerCase()).not.toContain("ranklayer");
  });

  it("does not introduce broken article links or legacy plan names", () => {
    const knownPaths = new Set([...BLOG_ARTICLES.map(({ canonicalPath }) => canonicalPath), ...BLOG_CATEGORIES.map(({ slug }) => `/pt/${slug}`)]);
    for (const content of Object.values(ARTICLE_CONTENTS)) {
      for (const linkedPath of content.related) expect(knownPaths.has(linkedPath)).toBe(true);
    }
    expect(articleContentsSource).not.toMatch(/href="\/pt\//);
    expect(articleContentsSource).not.toMatch(/\b(?:Plus|Pro)\b/);
  });

  it("enforces the blog subdomain for public blog routes", () => {
    const articlePath = newArticles[0].canonicalPath;
    const articleResponse = middleware(new NextRequest(`https://www.allecto.app${articlePath}?utm_source=test`));
    expect(articleResponse.status).toBe(308);
    expect(articleResponse.headers.get("location")).toBe(`https://blog.allecto.app${articlePath}?utm_source=test`);

    const blogResponse = middleware(new NextRequest("https://www.allecto.app/blog"));
    expect(blogResponse.status).toBe(308);
    expect(blogResponse.headers.get("location")).toBe("https://blog.allecto.app/");
  });
});
