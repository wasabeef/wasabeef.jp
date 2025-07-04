"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CodeCopyButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      // Find the pre element from the button's parent
      const button = e.currentTarget;
      const container = button.closest(".code-block-container");
      const preElement = container?.querySelector("pre");

      if (preElement) {
        // Get text content directly from the DOM
        const textToCopy = preElement.textContent || "";
        await navigator.clipboard.writeText(textToCopy);

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="code-copy-button"
      title={copied ? "コピー済み" : "コードをコピー"}
      type="button"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          <span className="ml-1">コピー済み</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span className="ml-1">コピー</span>
        </>
      )}
    </button>
  );
}
