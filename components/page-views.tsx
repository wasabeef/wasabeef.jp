"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

interface PageViewsProps {
  slug: string;
}

export function PageViews({ slug }: PageViewsProps) {
  const [views, setViews] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const incrementPageView = async () => {
      try {
        // Get current views from localStorage
        const storageKey = `page-views-${slug}`;
        const currentViews = parseInt(localStorage.getItem(storageKey) || "0");
        const newViews = currentViews + 1;
        
        // Update localStorage
        localStorage.setItem(storageKey, newViews.toString());
        
        // Set views state
        setViews(newViews);
        setLoading(false);
      } catch (error) {
        console.error("Error tracking page view:", error);
        setViews(0);
        setLoading(false);
      }
    };

    incrementPageView();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Eye className="h-4 w-4" />
        <span>--</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <Eye className="h-4 w-4" />
      <span>{views?.toLocaleString()}回表示</span>
    </div>
  );
}