import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  // Optimize images
  images: {
    domains: ["localhost"],
    formats: ["image/webp", "image/avif"],
  },
  // Reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

module.exports = {
  experimental: {
    turbo: true,
  },
};

export default nextConfig;
