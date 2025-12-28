import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  // Allow browser preview proxy origins for Server Actions
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3000', 'localhost:*', '127.0.0.1:*', 'localhost'],
    },
  },
  // Skip API routes during static generation
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
