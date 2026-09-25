/**
 * The page numbers to show: always the first and last, the current page and
 * one either side, with a gap marker wherever pages are skipped.
 * e.g. page 7 of 224 → 1 … 6 7 8 … 224.
 */
export function pageWindow(page: number, totalPages: number): (number | 'gap')[] {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);

  const out: (number | 'gap')[] = [];
  for (const n of pages) {
    const previous = out[out.length - 1];
    if (typeof previous === 'number' && n - previous > 1) {
      // A single skipped page reads better as its number than as "…".
      if (n - previous === 2) out.push(previous + 1);
      else out.push('gap');
    }
    out.push(n);
  }
  return out;
}
