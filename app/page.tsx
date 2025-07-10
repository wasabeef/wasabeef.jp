import { Suspense } from "react";
import type { Metadata } from "next";
import { Profile } from "@/components/profile";
import { SocialLinks } from "@/components/social-links";
import { Navigation } from "@/components/navigation";
import { BlogPreview } from "@/components/blog-preview";
import { LoadingSpinner } from "@/components/loading-spinner";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.siteName,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <div className="relative w-full max-w-2xl">
        {/* Navigation */}
        <nav
          className="absolute right-0 top-0 z-10"
          role="navigation"
          aria-label="メインナビゲーション"
        >
          <Navigation />
        </nav>

        {/* Main Content */}
        <div className="mt-12 flex flex-col items-center space-y-8">
          {/* Profile Section */}
          <section aria-labelledby="profile-heading">
            <h1 id="profile-heading" className="sr-only">
              プロフィール
            </h1>
            <Profile />
          </section>

          {/* Social Links Section */}
          <section aria-labelledby="social-heading">
            <h2 id="social-heading" className="sr-only">
              ソーシャルリンク
            </h2>
            <SocialLinks />
          </section>

          {/* Recent Posts Section */}
          <section
            className="mt-16 w-full"
            aria-labelledby="recent-posts-heading"
          >
            <h2
              id="recent-posts-heading"
              className="mb-4 text-center text-xl font-bold"
            >
              Recent Posts
            </h2>
            <Suspense fallback={<LoadingSpinner />}>
              <BlogPreview />
            </Suspense>
          </section>

          {/* Footer */}
          <footer
            className="mt-8 text-center text-sm text-muted-foreground"
            role="contentinfo"
          >
            <p>
              &copy; {new Date().getFullYear()} {siteConfig.author.name}. All
              rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
