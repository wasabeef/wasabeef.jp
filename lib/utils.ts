import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  try {
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "日付不明";
  }
}

export function formatDateShort(date: string | Date): string {
  try {
    return new Date(date).toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Error formatting short date:", error);
    return "不明";
  }
}

export function calculateReadingTime(content: string): number {
  try {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  } catch (error) {
    console.error("Error calculating reading time:", error);
    return 1;
  }
}

export function truncateText(text: string, maxLength: number): string {
  try {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
  } catch (error) {
    console.error("Error truncating text:", error);
    return text;
  }
}

export function slugify(text: string): string {
  try {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  } catch (error) {
    console.error("Error slugifying text:", error);
    return text;
  }
}

// Generate slug for heading IDs (simpler version)
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

export function generateOgImageUrl(title: string): string {
  try {
    const params = new URLSearchParams({
      title,
      theme: "light",
    });
    return `/api/og?${params.toString()}`;
  } catch (error) {
    console.error("Error generating OG image URL:", error);
    return "/og-default.jpg";
  }
}
