"use client";

import { Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  return (
    <Button variant="ghost" size="icon" aria-label="テーマアイコン">
      <Sun className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
}
