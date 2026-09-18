/**
 * Content Security Policy.
 *
 * Static rather than nonce-based: a per-request nonce forces every page to
 * render dynamically, which would throw away ISR and the $0 hosting budget
 * with it. Next.js and next-themes both emit inline bootstrap scripts, so
 * `script-src` needs 'unsafe-inline'; everything else is locked down —
 * no plugins, no framing, no foreign form targets, and network access only
 * to ourselves and Supabase.
 */
function contentSecurityPolicy() {
  const dev = process.env.NODE_ENV !== 'production';
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const supabaseWs = supabase.replace(/^http/, 'ws');

  const directives = {
    'default-src': ["'self'"],
    // React Refresh needs eval in development only.
    'script-src': ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    // README images come from anywhere on the web, but only over HTTPS.
    'img-src': ["'self'", 'https:', 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", supabase, supabaseWs, ...(dev ? ['ws:'] : [])].filter(Boolean),
    'frame-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'", 'blob:'],
  };

  const policy = Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');

  return dev ? policy : `${policy}; upgrade-insecure-requests`;
}

/** Security headers applied to every response, on any host. */
const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy() },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  // Workspace packages ship TypeScript source; Next compiles them in-place.
  transpilePackages: ['@mcphub/crawler', '@mcphub/db', '@mcphub/shared', '@mcphub/scoring'],
  images: {
    formats: ['image/avif', 'image/webp'],
    // Scoped to exact hosts and paths rather than a wildcard: `next/image`
    // will proxy and cache anything listed here, so a loose pattern turns the
    // deployment into an open image proxy on someone else's bandwidth budget.
    remotePatterns: [
      // Also serves the signed-in user's OAuth avatar in the header.
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
