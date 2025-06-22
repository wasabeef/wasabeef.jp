# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 blog/portfolio website built with TypeScript and React 19. It features a markdown-based blog system with Japanese localization for software engineer Daichi Furiya (Google Developers Expert for Android).

## Development Commands

```bash
# Package management
bun install        # Install dependencies

# Development server
bun dev            # Start development server

# Production build and deployment
bun build          # Build for production
bun start          # Start production server

# Code quality
bun lint           # Run ESLint
```

## Architecture Overview

### Core Structure

- **App Router**: Uses Next.js 15 App Router (`/app/` directory)
- **Content Management**: Markdown files in `/content/blog/` parsed with gray-matter
- **Styling**: Tailwind CSS with comprehensive shadcn/ui component library
- **Configuration**: Centralized site config in `/lib/config.ts`

### Key Files

- `/lib/blog.ts`: Core blog functionality (post fetching, parsing, metadata extraction)
- `/lib/config.ts`: Site configuration and metadata
- `/components/ui/`: Complete shadcn/ui component library
- `/app/layout.tsx`: Root layout with theme provider and metadata setup

### Blog System

Blog posts are markdown files with frontmatter containing:

- `title`, `description`, `date`, `tags`, `image` fields
- Automatic reading time calculation
- Tag-based filtering system
- SEO metadata generation

### Theme and Styling

- CSS variables-based theming system in `tailwind.config.ts`
- Light theme currently forced (theme provider present but unused)
- Comprehensive design tokens for colors, spacing, animations
- Typography plugin for markdown content styling

## Path Aliases

- `@/*` maps to the project root (configured in `tsconfig.json`)

## Performance Optimizations

- Image optimization disabled (`unoptimized: true`)
- Console statements removed in production builds
- Lucide React optimized for tree-shaking
- DNS prefetching configured for external resources

## Japanese Localization

- Site language: Japanese (`ja_JP`)
- All content and metadata configured for Japanese audience
- Social media integration optimized for Japanese platforms

## Known Limitations

- No testing framework configured
- Placeholder URLs in config need customization
- Theme switching functionality present but not actively used
