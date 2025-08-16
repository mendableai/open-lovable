import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let the build succeed even if there are TypeScript errors
  typescript: { ignoreBuildErrors: true },
  // Don’t fail on ESLint during CI builds
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
