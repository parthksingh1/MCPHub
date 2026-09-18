import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** iOS home-screen icon — the same mark as the favicon, rendered at 180px. */
export default function AppleIcon(): ImageResponse {
  return new ImageResponse(
    <svg width="180" height="180" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" fill="#09090b" />
      <g stroke="#fafafa" strokeWidth="2" strokeLinecap="round">
        <path d="M16 16.5V8.5M16 16.5 9.2 21.5M16 16.5l6.8 5" />
      </g>
      <g fill="#fafafa">
        <circle cx="16" cy="7.5" r="2.6" />
        <circle cx="8.4" cy="22.2" r="2.6" />
        <circle cx="23.6" cy="22.2" r="2.6" />
      </g>
      <circle cx="16" cy="16.5" r="3.6" fill="#22c55e" />
    </svg>,
    size,
  );
}
