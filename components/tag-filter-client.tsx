"use client";

import { useRouter } from "next/navigation";
import { TagBadge } from "@/components/tag-badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface TagFilterClientProps {
  tags: string[];
  selectedTag: string | null;
}

export function TagFilterClient({ tags, selectedTag }: TagFilterClientProps) {
  const router = useRouter();
  const [containerHeight, setContainerHeight] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初回レンダリング後にタグコンテナの高さを測定
  useEffect(() => {
    if (tags.length > 0 && !isInitialized) {
      const tagContainer = document.getElementById("tag-container");
      if (tagContainer) {
        setContainerHeight(tagContainer.offsetHeight);
        setIsInitialized(true);
      }
    }
  }, [tags, isInitialized]);

  const handleTagSelect = (tag: string | null) => {
    // 現在のスクロール位置を保存
    const scrollPosition = window.scrollY;

    if (tag) {
      router.push(`/blog?tag=${encodeURIComponent(tag)}`);
    } else {
      router.push("/blog");
    }

    // スクロール位置を復元
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
    }, 0);
  };

  return (
    <div className="mb-6">
      <div className="mb-2 flex h-8 items-center justify-between">
        <h2 className="text-sm font-medium">タグでフィルタリング</h2>
        {selectedTag && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => handleTagSelect(null)}
          >
            <X className="mr-1 h-3 w-3" />
            クリア
          </Button>
        )}
      </div>
      <div
        id="tag-container"
        className="flex flex-wrap gap-2 transition-all duration-200"
        style={containerHeight ? { minHeight: `${containerHeight}px` } : {}}
      >
        {tags.map((tag) => (
          <TagBadge
            key={tag}
            tag={tag}
            className={
              selectedTag === tag ? "bg-primary text-primary-foreground" : ""
            }
            onClick={() => handleTagSelect(tag === selectedTag ? null : tag)}
          />
        ))}
      </div>
    </div>
  );
}
