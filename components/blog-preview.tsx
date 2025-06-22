import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { getRecentPosts } from "@/lib/blog";
import { formatDate } from "@/lib/utils";
import { Clock } from "lucide-react";

export async function BlogPreview() {
  try {
    const recentPosts = await getRecentPosts(2);

    if (recentPosts.length === 0) {
      return (
        <Card className="p-4 text-center text-muted-foreground">
          <p className="text-sm">
            まだ投稿がありません。もうしばらくお待ちください！
          </p>
        </Card>
      );
    }

    return (
      <div className="space-y-2">
        {recentPosts.map((post) => (
          <Card
            key={post.slug}
            className="overflow-hidden transition-all hover:shadow-md"
          >
            <Link href={`/blog/${post.slug}`} className="block">
              <CardContent className="p-3 border-0">
                <div className="flex flex-col space-y-2">
                  <h3 className="line-clamp-1 font-medium">{post.title}</h3>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(post.date)}</span>
                    {post.readingTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.readingTime}分で読める</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}

        <div className="flex justify-center pt-2">
          <Link
            href="/blog"
            className="text-xs font-medium text-primary hover:underline"
          >
            すべての投稿を見る →
          </Link>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading blog preview:", error);
    return (
      <Card className="p-4 text-center text-muted-foreground">
        <p className="text-sm">ブログの読み込み中にエラーが発生しました。</p>
      </Card>
    );
  }
}
