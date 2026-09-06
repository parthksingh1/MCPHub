/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source; Next compiles them in-place.
  transpilePackages: ['@mcphub/crawler', '@mcphub/db', '@mcphub/shared', '@mcphub/scoring'],
  images: {
    formats: ['image/avif', 'image/webp'],
    // Scoped to exact hosts and paths rather than a wildcard: `next/image`
    // will proxy and cache anything listed here, so a loose pattern turns the
    // deployment into an open image proxy on someone else's bandwidth budget.
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      // github.com/<owner>.png is the stable avatar URL for an account, and is
      // what the npm enrichment path derives when it has no API response.
      { protocol: 'https', hostname: 'github.com', pathname: '/*.png' },
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
