import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize performance
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  // Optimize images for Vercel deployment
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  // Reduce bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Force dynamic rendering for all pages to prevent SSR context issues
  trailingSlash: false,
};

export default nextConfig;
