import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { TagBadge } from "@/components/tag-badge";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ShareButtons } from "@/components/share-buttons";
import { PageViews } from "@/components/page-views";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { formatDate } from "@/lib/utils";
import { siteConfig } from "@/lib/config";
import { Clock, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
      return {
        title: "記事が見つかりません",
        description: "お探しの記事は存在しないか、移動された可能性があります。",
      };
    }

    const ogImage = post.image
      ? post.image.startsWith("http")
        ? post.image
        : `https://wasabeef.jp${post.image}`
      : undefined;

    return {
      title: post.title,
      description: post.description || post.excerpt,
      openGraph: {
        title: post.title,
        description: post.description || post.excerpt,
        type: "article",
        url: `https://wasabeef.jp/blog/${post.slug}`,
        publishedTime: post.date,
        authors: ["Daichi Furiya"],
        tags: post.tags,
        images: ogImage
          ? [
              {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: post.title,
              },
            ]
          : undefined,
        siteName: siteConfig.siteName,
        locale: "ja_JP",
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.description || post.excerpt,
        images: ogImage ? [ogImage] : undefined,
        creator: "@wasabeef_jp",
      },
    };
  } catch (error) {
    console.error(`Error generating metadata for slug:`, error);
    return {
      title: "エラーが発生しました",
      description: "記事の読み込み中にエラーが発生しました。",
    };
  }
}

export async function generateStaticParams() {
  try {
    const posts = await getAllPosts();
    return posts.map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
      notFound();
    }

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

          {/* Back to Blog Button */}
          <div className="mt-12 mb-6">
            <Button
              variant="ghost"
              asChild
              className="flex items-center gap-2 text-sm"
            >
              <Link href="/blog">
                <ArrowLeft className="h-4 w-4" />
                ブログ一覧に戻る
              </Link>
            </Button>
          </div>

          {/* Article */}
          <article className="space-y-6">
            {/* Article Header */}
            <header className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                {post.title}
              </h1>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      scroll={false}
                    >
                      <TagBadge tag={tag} />
                    </Link>
                  ))}
                </div>
              )}

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                </div>
                {post.readingTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{post.readingTime}分で読める</span>
                  </div>
                )}
                <PageViews slug={post.slug} />
              </div>
            </header>

            {/* Article Content */}
            <div className="prose-container">
              <MarkdownRenderer content={post.content} />
            </div>

            {/* Share Buttons */}
            <div className="mt-8">
              <ShareButtons
                title={post.title}
                description={post.excerpt}
                url={`/blog/${post.slug}`}
              />
            </div>

            {/* Article Footer */}
            <footer className="border-t pt-6 mt-8">
              <div className="flex justify-between items-center">
                <Button variant="outline" asChild>
                  <Link href="/blog">← ブログ一覧</Link>
                </Button>
                <div className="text-sm text-muted-foreground">
                  最終更新: {formatDate(post.date)}
                </div>
              </div>
            </footer>
          </article>
        </div>
      </div>
    );
  } catch (error) {
    console.error(`Error rendering blog post:`, error);
    notFound();
  }
}
