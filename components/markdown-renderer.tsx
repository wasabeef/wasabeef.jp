"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEffect, useRef } from "react";
import type { Components } from "react-markdown";
import { generateSlug } from "@/lib/utils";
import { EXTERNAL_LINK } from "@/lib/constants";
import { TweetEmbed } from "@/components/tweet-embed";

// Custom Prism theme styles in globals.css

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && containerRef.current) {
      // Dynamically import Prism and languages only on client side
      const loadPrism = async () => {
        try {
          const Prism = await import("prismjs");

          // Load language components after Prism is loaded
          // JavaScript系
          await import("prismjs/components/prism-javascript");
          await import("prismjs/components/prism-typescript");
          await import("prismjs/components/prism-jsx");
          await import("prismjs/components/prism-tsx");

          // Web系
          await import("prismjs/components/prism-css");
          await import("prismjs/components/prism-json");
          await import("prismjs/components/prism-yaml");
          await import("prismjs/components/prism-xml-doc"); // XML サポート

          // シェル・スクリプト系
          await import("prismjs/components/prism-bash");
          await import("prismjs/components/prism-shell-session");

          // プログラミング言語
          await import("prismjs/components/prism-python");
          await import("prismjs/components/prism-java");
          await import("prismjs/components/prism-kotlin");
          await import("prismjs/components/prism-swift");
          await import("prismjs/components/prism-dart");
          await import("prismjs/components/prism-ruby");

          // ビルドツール
          await import("prismjs/components/prism-gradle");

          // 追加言語
          await import("prismjs/components/prism-lua");
          await import("prismjs/components/prism-rust");
          // TypeScript (ts)はJavaScriptの拡張として既にサポート済み

          // プラグイン
          await import("prismjs/plugins/line-numbers/prism-line-numbers");
          await import("prismjs/plugins/line-numbers/prism-line-numbers.css");

          if (containerRef.current) {
            // line-numbers クラスを追加
            const preElements = containerRef.current.querySelectorAll("pre");
            preElements.forEach((pre) => {
              pre.classList.add("line-numbers");
            });

            Prism.default.highlightAllUnder(containerRef.current);
          }
        } catch (error) {
          // Fail silently in build environments
          if (process.env.NODE_ENV === "development") {
            console.error("Failed to load Prism:", error);
          }
        }
      };

      loadPrism();
    }
  }, [content]);

  const components: Components = {
    code({ node, inline, className, children, ...props }) {
      if (inline) {
        return (
          <code className="inline-code" {...props}>
            {children}
          </code>
        );
      }

      // For code blocks, just return the code element
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    pre({ children, ...props }) {
      const codeElement = children as any;
      const className = codeElement?.props?.className || "";
      const match = /language-(\w+)/.exec(className);
      const language = match ? match[1] : "text"; // デフォルトを text に設定

      return (
        <div className="code-block-container group my-6">
          {language && (
            <div className="code-language-label">
              <span className="font-mono text-xs uppercase">{language}</span>
            </div>
          )}
          <pre
            className={className || "language-text"}
            {...props}
            tabIndex={undefined}
          >
            {children}
          </pre>
        </div>
      );
    },
    h1({ children }) {
      const id = generateSlug(String(children));
      return (
        <h1
          className="text-3xl font-bold mt-8 mb-4 text-gray-900 scroll-mt-20"
          id={id}
        >
          {children}
        </h1>
      );
    },
    h2({ children }) {
      const id = generateSlug(String(children));
      return (
        <h2
          className="text-2xl font-semibold mt-6 mb-3 text-gray-900 scroll-mt-20"
          id={id}
        >
          {children}
        </h2>
      );
    },
    h3({ children }) {
      const id = generateSlug(String(children));
      return (
        <h3
          className="text-xl font-semibold mt-5 mb-2 text-gray-900 scroll-mt-20"
          id={id}
        >
          {children}
        </h3>
      );
    },
    p({ children }) {
      return <p className="my-4 text-gray-700 leading-relaxed">{children}</p>;
    },
    ul({ children }) {
      return (
        <ul className="list-disc pl-6 my-4 text-gray-700 space-y-1">
          {children}
        </ul>
      );
    },
    ol({ children }) {
      return (
        <ol className="list-decimal pl-6 my-4 text-gray-700 space-y-1">
          {children}
        </ol>
      );
    },
    li({ children }) {
      return <li className="leading-relaxed">{children}</li>;
    },
    a({ href, children }) {
      const isExternal = href?.startsWith("http");
      return (
        <a
          href={href}
          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          aria-label={
            isExternal ? `${children} ${EXTERNAL_LINK.ariaLabel}` : undefined
          }
        >
          {children}
          {isExternal && (
            <span className="ml-1 text-xs" aria-hidden="true">
              {EXTERNAL_LINK.indicator}
            </span>
          )}
        </a>
      );
    },
    blockquote({ children }) {
      // Twitter埋め込みのチェック
      const childrenArray = Array.isArray(children) ? children : [children];
      const hasTwitterLink = childrenArray.some((child: any) => {
        if (typeof child === "object" && child?.props?.children) {
          const innerChildren = Array.isArray(child.props.children)
            ? child.props.children
            : [child.props.children];
          return innerChildren.some((innerChild: any) => {
            return (
              innerChild?.props?.href?.includes("twitter.com") &&
              innerChild?.props?.href?.includes("/status/")
            );
          });
        }
        return false;
      });

      if (hasTwitterLink) {
        // Twitter URLを抽出
        let twitterUrl = "";
        childrenArray.forEach((child: any) => {
          if (typeof child === "object" && child?.props?.children) {
            const innerChildren = Array.isArray(child.props.children)
              ? child.props.children
              : [child.props.children];
            innerChildren.forEach((innerChild: any) => {
              if (
                innerChild?.props?.href?.includes("twitter.com") &&
                innerChild?.props?.href?.includes("/status/")
              ) {
                twitterUrl = innerChild.props.href;
              }
            });
          }
        });

        if (twitterUrl) {
          const match = twitterUrl.match(/twitter\.com\/(\w+)\/status\/(\d+)/);
          if (match) {
            const username = match[1];
            const tweetId = match[2];
            return <TweetEmbed username={username} tweetId={tweetId} />;
          }
        }
      }

      return (
        <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-6 bg-gray-50 py-3 rounded-r">
          {children}
        </blockquote>
      );
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto my-6 rounded-lg border border-gray-200">
          <table className="w-full border-collapse">{children}</table>
        </div>
      );
    },
    th({ children }) {
      return (
        <th className="border-b border-gray-300 px-4 py-3 text-left bg-gray-50 font-semibold text-gray-900">
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td className="border-b border-gray-200 px-4 py-3 text-left text-gray-700">
          {children}
        </td>
      );
    },
    tr({ children, ...props }) {
      return (
        <tr className="hover:bg-gray-50 transition-colors" {...props}>
          {children}
        </tr>
      );
    },
    hr() {
      return <hr className="my-8 border-gray-200" />;
    },
    strong({ children }) {
      return (
        <strong className="font-semibold text-gray-900">{children}</strong>
      );
    },
    em({ children }) {
      return <em className="italic text-gray-700">{children}</em>;
    },
  };

  return (
    <div ref={containerRef} className="prose max-w-none">
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
