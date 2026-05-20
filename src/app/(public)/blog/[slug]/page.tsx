import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { articleJsonLd } from "@/lib/seo/schema";
import { getBlogCategories, getBlogPostBySlug, getBlogPosts } from "@/lib/site";
import { absoluteUrl } from "@/lib/utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {};
  }

  return buildMetadata({
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
    path: `/blog/${slug}`,
    image: post.ogImage ?? post.image,
    openGraphType: "article",
    article: { publishedTime: post.publishedAt },
    noIndex: post.noIndex
  });
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const [post, categories] = await Promise.all([getBlogPostBySlug(slug), getBlogCategories()]);

  if (!post) {
    notFound();
  }

  const category = categories.find((item) => item.id === post.categoryId);

  const pageUrl = absoluteUrl(`/blog/${slug}`);

  return (
    <section className="section">
      <JsonLd data={articleJsonLd(post, pageUrl)} />
      <div className="container">
        <article className="card stack">
          <span className="eyebrow">{category?.title ?? "Статья"}</span>
          <h1 className="section-title">{post.title}</h1>
          <p>{post.excerpt}</p>
          <div className="pill-list">
            {post.keywords.map((keyword) => (
              <span key={keyword} className="pill">
                {keyword}
              </span>
            ))}
          </div>
          <Image
            className="media-image"
            src="/images/quartz-project-composition.svg"
            alt={post.title}
            width={1400}
            height={980}
            style={{ height: 320 }}
          />
          {post.content.split("\n\n").map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {post.videoUrl ? <p>Видео: {post.videoUrl}</p> : null}
          <div className="btn-row">
            <Link className="button" href="/contacts">
              Обсудить проект
            </Link>
            <Link className="button-secondary" href="/blog">
              Все статьи
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
