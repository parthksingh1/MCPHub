/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source; Next compiles them in-place.
  transpilePackages: ['@mcphub/db', '@mcphub/shared', '@mcphub/scoring'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
    ],
  },
  experimental: {
    // Keeps icon and animation imports from bloating client bundles.
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  eslint: {
    // Linting is a separate CI step; don't pay for it twice during build.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
