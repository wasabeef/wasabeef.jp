"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BlogCard } from "@/components/blog-card";
import { TagFilterClient } from "@/components/tag-filter-client";
import type { BlogPost } from "@/lib/types";

interface BlogPageClientProps {
  posts: BlogPost[];
  allTags: string[];
}

function BlogPageContent({ posts, allTags }: BlogPageClientProps) {
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get("tag") || null;

  const filteredPosts = selectedTag
    ? posts.filter((post) => post.tags.includes(selectedTag))
    : posts;

  return (
    <>
      {/* Tag Filter */}
      {allTags.length > 0 && (
        <section aria-labelledby="tag-filter-heading">
          <h2 id="tag-filter-heading" className="sr-only">
            タグフィルター
          </h2>
          <TagFilterClient tags={allTags} selectedTag={selectedTag} />
        </section>
      )}

      {/* Blog Posts */}
      <section className="min-h-[300px]" aria-labelledby="blog-posts-heading">
        <h2 id="blog-posts-heading" className="sr-only">
          ブログ記事一覧
        </h2>
        {filteredPosts.length > 0 ? (
          <div className="grid gap-6" role="list">
            {filteredPosts.map((post) => (
              <article key={post.slug} role="listitem">
                <BlogCard post={post} />
              </article>
            ))}
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center rounded-lg border p-8 text-center text-muted-foreground">
            {selectedTag ? (
              <p>「{selectedTag}」のタグが付いた投稿はありません。</p>
            ) : (
              <p>まだブログ投稿がありません。もうしばらくお待ちください。</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}

export default function BlogPageClient(props: BlogPageClientProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BlogPageContent {...props} />
    </Suspense>
  );
}
