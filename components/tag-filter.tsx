"use client";
import { TagBadge } from "@/components/tag-badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

interface TagFilterProps {
  tags: string[];
  selectedTag: string | null;
  onTagSelect: (tag: string | null) => void;
}

export function TagFilter({ tags, selectedTag, onTagSelect }: TagFilterProps) {
  // タグコンテナの高さを管理するための状態
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

  return (
    <div className="mb-6">
      <div className="mb-2 flex h-8 items-center justify-between">
        <h2 className="text-sm font-medium">タグでフィルタリング</h2>
        {selectedTag && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => onTagSelect(null)}
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
            onClick={() => onTagSelect(tag === selectedTag ? null : tag)}
          />
        ))}
      </div>
    </div>
  );
}
