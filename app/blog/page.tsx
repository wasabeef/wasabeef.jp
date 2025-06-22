import { Suspense } from "react";
import type { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import { BlogCard } from "@/components/blog-card";
import { getAllPosts, getAllTags } from "@/lib/blog";
import { TagFilterClient } from "@/components/tag-filter-client";
import { LoadingSpinner } from "@/components/loading-spinner";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "ブログ",
  description: "技術ブログとエンジニアリングに関する記事を掲載しています。",
  openGraph: {
    title: `ブログ | ${siteConfig.title}`,
    description: "技術ブログとエンジニアリングに関する記事を掲載しています。",
    url: `${siteConfig.url}/blog`,
  },
  alternates: {
    canonical: `${siteConfig.url}/blog`,
  },
};

interface BlogPageProps {
  searchParams: Promise<{ tag?: string }>;
}

async function BlogContent({ searchParams }: BlogPageProps) {
  try {
    const params = await searchParams;
    const [posts, allTags] = await Promise.all([getAllPosts(), getAllTags()]);

    const selectedTag = params.tag || null;
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
                <p>まだブログ投稿がありません。もうしばらくお待ちください！</p>
              )}
            </div>
          )}
        </section>
      </>
    );
  } catch (error) {
    console.error("Error loading blog content:", error);
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border p-8 text-center text-muted-foreground">
        <p>
          ブログの読み込み中にエラーが発生しました。しばらく後でもう一度お試しください。
        </p>
      </div>
    );
  }
}

export default function BlogPage(props: BlogPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <div className="relative w-full max-w-2xl">
        {/* Navigation */}
        <nav
          className="absolute right-0 top-0 z-10"
          role="navigation"
          aria-label="メインナビゲーション"
        >
          <Navigation />
        </nav>

        {/* Main Content */}
        <main className="mt-12">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold">ブログ</h1>
          </header>

          <Suspense fallback={<LoadingSpinner />}>
            <BlogContent {...props} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
