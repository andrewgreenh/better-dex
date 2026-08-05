/**
 * Scroll restoration for the two long lists.
 *
 * Both use `content-visibility: auto` so that only the rows near the viewport
 * are ever laid out. Every other row is merely *assumed* to be
 * `contain-intrinsic-size` tall — and the guesses are off: a ranking row is
 * really 123px, or 136px when the name wraps, against a guess of 116px.
 * Across a thousand rows that is thousands of pixels, and the total keeps
 * moving as rows get measured for real. A remembered pixel offset therefore
 * points at completely different content by the time you come back, which is
 * why the browser's own restoration lands hundreds of pixels off.
 *
 * So no pixel offset is remembered. We remember which row was tapped and how
 * far down the screen it sat, and put that row back in the same spot — which
 * holds no matter how much the estimated layout above it has drifted.
 */

const STORAGE_KEY = "better-dex:scroll";

/** Enough for a few levels of back and forth; the rest is dropped. */
const MAX_ENTRIES = 12;

export interface ScrollAnchor {
  /** DOM id of the row — "p-25" in the grid, "r-25" in the ranking. */
  id: string;
  /** Where its top edge sat relative to the viewport. */
  top: number;
}

type AnchorMap = Record<string, ScrollAnchor>;

function read(): AnchorMap {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}") as AnchorMap;
  } catch {
    return {};
  }
}

/**
 * Called when a list navigates away: `locationKey` is the history entry we
 * will come back to, `element` the row that was tapped.
 */
export function rememberAnchor(locationKey: string, element: Element): void {
  if (!element.id) return;
  try {
    const map = read();
    map[locationKey] = { id: element.id, top: Math.round(element.getBoundingClientRect().top) };
    const keys = Object.keys(map);
    for (const stale of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) delete map[stale];
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* private mode / quota — restoration just falls back to the top */
  }
}

export function readAnchor(locationKey: string): ScrollAnchor | null {
  const anchor = read()[locationKey];
  return anchor && typeof anchor.id === "string" ? anchor : null;
}
