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
  // Webpack configuration to handle dynamic imports better
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
