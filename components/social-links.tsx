import {
  Github,
  Linkedin,
  Twitter,
  Globe,
  FileText,
  Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
import type { SocialLink } from "@/lib/types";

const socialLinks: SocialLink[] = [
  {
    name: "GitHub",
    url: siteConfig.social.github,
    icon: <Github className="h-5 w-5" />,
    external: true,
  },
  {
    name: "LinkedIn",
    url: siteConfig.social.linkedin,
    icon: <Linkedin className="h-5 w-5" />,
    external: true,
  },
  {
    name: "Twitter",
    url: siteConfig.social.twitter,
    icon: <Twitter className="h-5 w-5" />,
    external: true,
  },
  {
    name: "Medium",
    url: siteConfig.social.medium,
    icon: <FileText className="h-5 w-5" />,
    external: true,
  },
  {
    name: "SpeakerDeck",
    url: siteConfig.social.speakerdeck,
    icon: <Presentation className="h-5 w-5" />,
    external: true,
  },
  {
    name: "Website",
    url: siteConfig.social.website,
    icon: <Globe className="h-5 w-5" />,
    external: true,
  },
];

export function SocialLinks() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {socialLinks.map((link) => (
        <Button
          key={link.name}
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full transition-all hover:scale-110 hover:bg-primary hover:text-primary-foreground"
          asChild
        >
          <a
            href={link.url}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            aria-label={`${link.name}のプロフィールを開く`}
          >
            {link.icon}
          </a>
        </Button>
      ))}
    </div>
  );
}
