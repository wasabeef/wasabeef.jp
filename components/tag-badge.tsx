"use client";

import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag: string;
  className?: string;
  onClick?: () => void;
}

export function TagBadge({ tag, className, onClick }: TagBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors",
        onClick &&
          "cursor-pointer hover:bg-primary hover:text-primary-foreground",
        className,
      )}
      onClick={onClick}
    >
      {tag}
    </span>
  );
}
