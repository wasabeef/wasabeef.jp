import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TagBadge } from "@/components/tag-badge";
import { formatDate } from "@/lib/utils";
import { Clock, Star } from "lucide-react";
import type { Post } from "@/lib/types";

interface BlogCardProps {
  post: Post;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md group">
      <Link href={`/blog/${post.slug}`} className="block">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-xl group-hover:text-primary transition-colors">
              {post.title}
            </CardTitle>
            {post.featured && (
              <Star
                className="h-5 w-5 text-yellow-500 flex-shrink-0"
                fill="currentColor"
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {post.excerpt}
          </p>
        </CardContent>
      </Link>
      <CardFooter className="flex flex-col items-start space-y-2 border-t p-4">
        <div className="flex flex-wrap gap-1">
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
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>{formatDate(post.date)}</span>
          {post.readingTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{post.readingTime}分で読める</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
