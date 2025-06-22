import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/lib/config";

export function Profile() {
  const { author } = siteConfig;

  return (
    <Card className="w-full border-none bg-transparent shadow-none">
      <CardContent className="flex flex-col items-center p-0 text-center">
        <div className="relative mb-6 h-32 w-32 overflow-hidden rounded-full border-4 border-background bg-muted shadow-lg">
          <Image
            src={author.avatar || "/placeholder.svg"}
            alt={`${author.name}のプロフィール写真`}
            width={128}
            height={128}
            className="object-cover"
            priority
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        </div>
        <h1 className="mb-2 text-3xl font-bold">{author.name}</h1>
        <h2 className="mb-4 text-xl font-medium text-muted-foreground">
          {author.title}
        </h2>
        <p className="max-w-md text-muted-foreground">{author.bio}</p>
      </CardContent>
    </Card>
  );
}
