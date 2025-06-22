import type React from "react";
export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  readingTime?: number;
  featured?: boolean;
}

export interface BlogMetadata {
  title: string;
  date: string;
  excerpt: string;
  tags?: string[];
  featured?: boolean;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: React.ReactNode;
  external?: boolean;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}
