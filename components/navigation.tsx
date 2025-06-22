"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, BookOpen } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        asChild
        className={cn("rounded-full", pathname === "/" && "bg-muted")}
      >
        <Link href="/" aria-label="Home">
          <Home className="h-5 w-5" />
        </Link>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        asChild
        className={cn(
          "rounded-full",
          pathname.startsWith("/blog") && "bg-muted",
        )}
      >
        <Link href="/blog" aria-label="Blog">
          <BookOpen className="h-5 w-5" />
        </Link>
      </Button>
    </nav>
  );
}
