/**
 * Formats a count compactly: 1234 → "1.2k", 1200000 → "1.2M".
 *
 * Star counts sit inside cards on a grid, so a predictable narrow width
 * matters more than exactness — nobody reads "12,847" as anything other than
 * "about thirteen thousand".
 */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (value < 1000) return String(value);

  if (value < 1_000_000) {
    const thousands = value / 1000;
    return `${thousands < 10 ? thousands.toFixed(1).replace(/\.0$/, '') : Math.round(thousands)}k`;
  }

  const millions = value / 1_000_000;
  return `${millions < 10 ? millions.toFixed(1).replace(/\.0$/, '') : Math.round(millions)}M`;
}

/**
 * Formats a timestamp as a relative age: "3 days ago", "2 months ago".
 *
 * Uses `Intl.RelativeTimeFormat` so the phrasing is correct in the user's
 * locale rather than hand-rolled English.
 */
export function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) return 'unknown';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';

  const seconds = (date.getTime() - Date.now()) / 1000;
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [unit, secondsPerUnit] of units) {
    if (Math.abs(seconds) >= secondsPerUnit) {
      return formatter.format(Math.round(seconds / secondsPerUnit), unit);
    }
  }

  return 'just now';
}

/** Formats a timestamp as an absolute date, for `title` attributes. */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return 'Unknown';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

/**
 * Formats a rating average for display, or null when nobody has rated yet.
 * Returning null lets callers render "Not yet rated" rather than a misleading
 * "0.0" that looks like a terrible score.
 */
export function formatRating(average: string | number, count: number): string | null {
  if (count === 0) return null;

  const value = typeof average === 'string' ? Number.parseFloat(average) : average;
  return Number.isFinite(value) ? value.toFixed(1) : null;
}

/** Turns an SPDX identifier into something readable, or null when absent. */
export function formatLicense(license: string | null): string | null {
  if (!license) return null;

  // GitHub reports a licence it cannot identify as NOASSERTION, which means
  // "there is a licence file but it is not a recognised one" — showing that
  // string to a user would be worse than saying nothing.
  if (license === 'NOASSERTION') return 'Custom';

  return license;
}
