import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    localPatterns: [
      { pathname: '/assets/**' },
      { pathname: '/_next/**' },
      { pathname: '/**' },
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pinimg.com' },
      { protocol: 'https', hostname: '*.pinimg.com' },
      { protocol: 'https', hostname: 'pinimg.com' },
    ],
  },
};

export default nextConfig;
