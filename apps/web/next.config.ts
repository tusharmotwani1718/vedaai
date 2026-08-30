import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // `@vedaai/shared` is published as raw TypeScript inside the monorepo, so
  // Next has to compile it rather than treat it as a prebuilt dependency.
  transpilePackages: ['@vedaai/shared'],
  devIndicators: false
};

export default nextConfig;
