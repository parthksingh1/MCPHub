import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MCPHub — The trusted directory for MCP servers';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * The site-wide Open Graph image.
 *
 * Generated rather than a static asset so it stays in step with the brand,
 * with the real logo mark read from `public/brand`. Deliberately typographic: OG images are
 * rendered at thumbnail size in most feeds, where anything detailed turns to
 * mush.
 */
export default async function OpenGraphImage(): Promise<ImageResponse> {
  // The real logo mark, bundled with the route so the edge runtime can read it.
  const mark = await fetch(new URL('../public/brand/mark.png', import.meta.url)).then((response) =>
    response.arrayBuffer(),
  );

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#0a0a0b',
        padding: 80,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={mark as unknown as string} width={48} height={48} style={{ borderRadius: 11 }} />
        <span style={{ color: '#ffffff', fontSize: 30, fontWeight: 600 }}>MCPHub</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            color: '#ffffff',
            fontSize: 76,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: -2.5,
          }}
        >
          The trusted directory
        </span>
        <span
          style={{
            fontSize: 76,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: -2.5,
            background: 'linear-gradient(90deg, #7c3aed, #3b82f6)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          for MCP servers.
        </span>
      </div>

      <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 28 }}>
        Scored · Scanned · Vetted
      </span>
    </div>,
    size,
  );
}
