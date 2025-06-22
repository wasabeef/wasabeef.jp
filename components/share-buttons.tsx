"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Clipboard, Check } from "lucide-react";
import { siteConfig } from "@/lib/config";

interface ShareButtonsProps {
  title: string;
  description: string;
  url: string;
}

export function ShareButtons({ title, description, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${siteConfig.url}${url}`;
  const shareText = `${title} - ${siteConfig.name}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const shareOnX = () => {
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(xUrl, "_blank", "noopener,noreferrer");
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: description,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Native share failed:", error);
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 py-4 text-sm text-gray-600 border-y">
      <span className="font-medium">シェア:</span>
      
      {/* X (Twitter) */}
      <button
        onClick={shareOnX}
        className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        X
      </button>

      {/* Copy URL */}
      <button
        onClick={copyToClipboard}
        className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-green-600">コピー済み</span>
          </>
        ) : (
          <>
            <Clipboard className="h-4 w-4" />
            URL
          </>
        )}
      </button>

      {/* Native Share (mobile) */}
      {typeof window !== "undefined" && navigator.share && (
        <button
          onClick={nativeShare}
          className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
        >
          <Share2 className="h-4 w-4" />
          その他
        </button>
      )}
    </div>
  );
}