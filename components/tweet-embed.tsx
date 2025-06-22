"use client";

import { useEffect } from "react";

interface TweetEmbedProps {
  tweetId: string;
  username: string;
}

declare global {
  interface Window {
    twttr?: any;
  }
}

export function TweetEmbed({ tweetId, username }: TweetEmbedProps) {
  useEffect(() => {
    // Twitter widgets.js が既に読み込まれているかチェック
    if (window.twttr) {
      window.twttr.widgets.load();
      return;
    }

    // Twitter のスクリプトを動的に読み込む
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    script.charset = "utf-8";
    
    script.onload = () => {
      if (window.twttr) {
        window.twttr.widgets.load();
      }
    };

    document.body.appendChild(script);
  }, [tweetId]);

  return (
    <div className="my-6 flex justify-center">
      <blockquote className="twitter-tweet" data-lang="ja">
        <a href={`https://twitter.com/${username}/status/${tweetId}`}>
          Loading tweet...
        </a>
      </blockquote>
    </div>
  );
}