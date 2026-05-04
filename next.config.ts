import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip type-checking and linting during build to avoid OOM crashes.
  // Types are still enforced in the editor and dev server via tsconfig.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {}
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        encoding: false,
      }
    }
    return config
  },
};

export default nextConfig;
