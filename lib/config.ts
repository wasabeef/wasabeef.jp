import { LIMITS } from "./constants";

export const siteConfig = {
  name: "Daichi Furiya",
  title: "ポートフォリオ",
  description:
    "Google Developers Expert for Android。ポートフォリオサイト。",
  url: "https://wasabeef.jp",
  ogImage: "https://wasabeef.jp/og.jpg",
  author: {
    name: "Daichi Furiya",
    title: "Software Engineer",
    bio: "Google Developers Expert for Android.",
    avatar: "/avatar.jpg",
  },
  social: {
    github: "https://github.com/wasabeef",
    linkedin: "https://linkedin.com/in/wasabeef",
    twitter: "https://x.com/wasabeef_jp",
    medium: "http://wasabeef.medium.com/",
    speakerdeck: "https://speakerdeck.com/wasabeef",
    website: "https://wasabeef.jp",
  },
  blog: {
    postsPerPage: LIMITS.postsPerPage,
    featuredPostsCount: LIMITS.featuredPosts,
  },
} as const;

export type SiteConfig = typeof siteConfig;
