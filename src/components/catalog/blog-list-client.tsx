"use client";

import { useSearchParams } from "next/navigation";

import { MediaCard } from "@/components/ui/content";
import type { BlogCategory, BlogPost } from "@/types/content";

type BlogListClientProps = {
  posts: BlogPost[];
  categories: BlogCategory[];
};

function formatPublishedAt(iso: string) {
  const parsed = new Date(iso);
  // Битая дата из CMS не должна давать «Invalid Date» в карточке (и потенциальные сюрпризы при сортировке на сервере).
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("ru-RU");
}

export function BlogListClient({ posts, categories }: BlogListClientProps) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const filtered = category ? posts.filter((post) => post.categoryId === category) : posts;

  return (
    <div className="grid grid-3">
      {filtered.map((post, index) => {
        const categoryItem = categories.find((item) => item.id === post.categoryId);

        return (
          <MediaCard
            key={post.id}
            href={`/blog/${post.slug}`}
            title={post.title}
            description={post.excerpt}
            label={categoryItem?.title}
            meta={formatPublishedAt(post.publishedAt)}
            imageUrl={post.image || "/images/quartz-surface-light.svg"}
            imagePriority={index < 3}
            titleLevel={2}
          />
        );
      })}
    </div>
  );
}
