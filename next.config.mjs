/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    formats: ["image/webp", "image/avif"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Optimize bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Cloudflare Pages の場合は通常の静的エクスポート
  output: "export",
};

export default nextConfig;
