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
- `/lib/constants.ts`: Centralized constants to reduce hardcoded values
- `/components/ui/`: Complete shadcn/ui component library
- `/components/markdown-renderer.tsx`: Markdown rendering with Prism.js syntax highlighting
- `/components/share-buttons.tsx`: Social media sharing functionality
- `/components/page-views.tsx`: Client-side page view tracking
- `/components/tweet-embed.tsx`: Twitter post embedding
- `/app/layout.tsx`: Root layout with theme provider and metadata setup

### Blog System

Blog posts are markdown files with frontmatter containing:

- `title`, `description`, `date`, `tags`, `image` fields
- Tags limited to 3 main tags per article for better organization
- Automatic reading time calculation
- Tag-based filtering system
- SEO metadata generation
- Syntax highlighting with Prism.js (supports 8+ languages)
- Line numbers support for code blocks
- Twitter embed functionality in blockquotes

### Theme and Styling

- CSS variables-based theming system in `tailwind.config.ts`
- Light theme currently forced (theme provider present but unused)
- Comprehensive design tokens for colors, spacing, animations
- Typography plugin for markdown content styling

## Path Aliases

- `@/*` maps to the project root (configured in `tsconfig.json`)

## Performance Optimizations

- Static site generation (SSG) with `output: "export"` for Cloudflare Pages
- Image optimization disabled (`unoptimized: true`)
- Console statements removed in production builds
- Lucide React optimized for tree-shaking
- DNS prefetching configured for external resources
- Client-side rendering for dynamic components (search params, page views)
- Code splitting and lazy loading of Prism.js syntax highlighting

## Japanese Localization

- Site language: Japanese (`ja_JP`)
- All content and metadata configured for Japanese audience
- Social media integration optimized for Japanese platforms

## Features Implemented

### Content Management

- Markdown-based blog posts with frontmatter metadata
- Tag-based filtering (limited to 3 tags per post)
- Automatic reading time calculation
- Static page generation for all blog posts

### UI/UX Features

- Responsive design with mobile-first approach
- Syntax highlighting with line numbers (Prism.js)
- Social sharing (X/Twitter, URL copy, native mobile share)
- Page view tracking (localStorage-based)
- Twitter post embedding in blockquotes
- Search and filtering by tags

### Technical Features

- Cloudflare Pages deployment ready
- Client-side hydration for dynamic components
- Suspense boundaries for proper static export
- CSS custom properties for theming
- Centralized constants pattern

## Known Limitations

- No testing framework configured
- Theme switching functionality present but not actively used
- Page views are client-side only (localStorage)
- No server-side analytics integration
