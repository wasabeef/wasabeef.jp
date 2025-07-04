import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { cache } from "react";
import type { Post, BlogMetadata } from "@/lib/types";
import { calculateReadingTime } from "@/lib/utils";

const postsDirectory = path.join(process.cwd(), "content", "blog");

// React cacheでメモ化
export const getAllPosts = cache(async (): Promise<Post[]> => {
  try {
    if (!fs.existsSync(postsDirectory)) {
      console.warn(`Blog directory not found: ${postsDirectory}`);
      return [];
    }

    const fileNames = fs.readdirSync(postsDirectory);
    const postsPromises = fileNames
      .filter((fileName) => {
        const fullPath = path.join(postsDirectory, fileName);
        return fileName.endsWith(".md") && fs.statSync(fullPath).isFile();
      })
      .map(async (fileName) => {
        const slug = fileName.replace(/\.md$/, "");
        const post = await getPostBySlug(slug);
        return post;
      });

    const posts = (await Promise.all(postsPromises)).filter(
      (post): post is Post => post !== null,
    );
    return posts.sort((a, b) => (new Date(b.date) > new Date(a.date) ? 1 : -1));
  } catch (error) {
    console.error("Error getting all posts:", error);
    return [];
  }
});

export const getPostBySlug = cache(
  async (slug: string): Promise<Post | null> => {
    try {
      const safeSlug = slug.replace(/\.\.\//g, "").replace(/\//g, "-");
      const mdPath = path.join(postsDirectory, `${safeSlug}.md`);

      if (!fs.existsSync(mdPath)) {
        return null;
      }

      const stats = fs.statSync(mdPath);
      if (!stats.isFile()) {
        return null;
      }

      const fileContent = fs.readFileSync(mdPath, "utf8");
      const { data, content } = matter(fileContent);

      const metadata = data as BlogMetadata;
      const readingTime = calculateReadingTime(content);

      return {
        slug: safeSlug,
        title: metadata.title || "Untitled Post",
        date: metadata.date
          ? new Date(metadata.date).toISOString()
          : new Date().toISOString(),
        excerpt: metadata.excerpt || "",
        content,
        tags: Array.isArray(metadata.tags)
          ? metadata.tags
          : metadata.tags
            ? [metadata.tags]
            : [],
        readingTime,
        featured: metadata.featured || false,
        image: metadata.image,
        description: metadata.description || metadata.excerpt || "",
      };
    } catch (error) {
      console.error(`Error getting post by slug ${slug}:`, error);
      return null;
    }
  },
);

export const getAllTags = cache(async (): Promise<string[]> => {
  try {
    const posts = await getAllPosts();
    const tagsSet = new Set<string>();

    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        tagsSet.add(tag);
      });
    });

    return Array.from(tagsSet).sort();
  } catch (error) {
    console.error("Error getting all tags:", error);
    return [];
  }
});

export const getFeaturedPosts = cache(async (): Promise<Post[]> => {
  const posts = await getAllPosts();
  return posts.filter((post) => post.featured).slice(0, 3);
});

export const getRecentPosts = cache(async (limit = 3): Promise<Post[]> => {
  const posts = await getAllPosts();
  return posts.slice(0, limit);
});

export const getPostsByTag = cache(async (tag: string): Promise<Post[]> => {
  const posts = await getAllPosts();
  return posts.filter((post) => post.tags.includes(tag));
});
