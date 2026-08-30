import type { Metadata } from "next";
import React from "react";
import { notFound } from "next/navigation";
import { ARTICLE_CONTENTS } from "../../../../src/blog/articleContents";
import { ArticlePage } from "../../../../src/blog/ArticlePage";
import { BLOG_ARTICLES, BLOG_ORIGIN, getArticle } from "../../../../src/blog/content";

type Props = { params: { category: string; article: string } };

export function generateStaticParams() {
  return BLOG_ARTICLES.filter((article) => article.slug in ARTICLE_CONTENTS).map((article) => ({ category: article.categorySlug, article: article.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const article = getArticle(params.category, params.article);
  if (!article || !(article.slug in ARTICLE_CONTENTS)) return {};
  const canonical = `${BLOG_ORIGIN}${article.canonicalPath}`;
  const image = { url: `${BLOG_ORIGIN}${article.imagePath}`, width: 1200, height: 630, alt: article.imageAlt };
  return {
    title: article.seoTitle,
    description: article.description,
    alternates: { canonical },
    openGraph: { title: article.seoTitle, description: article.description, url: canonical, siteName: "Blog Allecto", locale: "pt_BR", type: "article", publishedTime: article.publishedAt, modifiedTime: article.modifiedAt, authors: [article.author], images: [image] },
    twitter: { card: "summary_large_image", title: article.seoTitle, description: article.description, images: [image.url] },
  };
}

export default function NewArticlePage({ params }: Props) {
  const article = getArticle(params.category, params.article);
  const content = ARTICLE_CONTENTS[params.article as keyof typeof ARTICLE_CONTENTS];
  if (!article || !content || article.categorySlug !== params.category) notFound();
  return <ArticlePage article={article} content={content} />;
}
