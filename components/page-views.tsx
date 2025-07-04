"use client";

import { useEffect, useState, useRef } from "react";
import { Eye } from "lucide-react";

interface PageViewsProps {
  slug: string;
}

export function PageViews({ slug }: PageViewsProps) {
  const [views, setViews] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const hasIncremented = useRef(false);

  useEffect(() => {
    const fetchAndIncrementViews = async () => {
      try {
        // ローカル開発時は localStorage を使用
        if (process.env.NODE_ENV === "development") {
          const storageKey = `page-views-${slug}`;
          const currentViews = parseInt(
            localStorage.getItem(storageKey) || "0",
          );
          const newViews = currentViews + 1;
          localStorage.setItem(storageKey, newViews.toString());
          setViews(newViews);
          setLoading(false);
          return;
        }

        // 本番環境では Cloudflare Workers KV を使用
        // まず現在のビュー数を取得
        const getResponse = await fetch(`/api/views/${slug}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("GET response status:", getResponse.status);

        if (getResponse.ok) {
          const data = await getResponse.json();
          console.log("Current views:", data.views);
          setViews(data.views || 0);
        } else {
          // API エラーの場合は非表示フラグを設定
          throw new Error(`API returned ${getResponse.status}`);
        }

        // 初回訪問時のみインクリメント
        if (!hasIncremented.current) {
          hasIncremented.current = true;
          const postResponse = await fetch(`/api/views/${slug}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (postResponse.ok) {
            const data = await postResponse.json();
            setViews(data.views || 0);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error tracking page view:", error);
        // エラー時は非表示にする
        setViews(-1); // -1 を特別な値として使用
        setLoading(false);
      }
    };

    fetchAndIncrementViews();
  }, [slug]);

  // API エラーの場合は非表示
  if (views === -1) {
    return null;
  }

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
      <span>{views.toLocaleString()}回表示</span>
    </div>
  );
}
