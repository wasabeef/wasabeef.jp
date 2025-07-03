import type { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import { getAllPosts, getAllTags } from "@/lib/blog";
import { siteConfig } from "@/lib/config";
import BlogPageClient from "@/components/blog-page-client";

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

export default async function BlogPage() {
  const [posts, allTags] = await Promise.all([getAllPosts(), getAllTags()]);

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

          <BlogPageClient posts={posts} allTags={allTags} />
        </main>
      </div>
    </div>
  );
}
