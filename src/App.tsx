import { useLayoutEffect, useRef } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { DexProvider } from "./DexProvider";
import { readAnchor } from "./lib/scroll";
import { DownloadIcon, MatrixIcon, PokeballIcon, RankingIcon, SwordIcon } from "./components/icons";
import { ListLink } from "./components/ListLink";
import { PwaSetup } from "./components/PwaSetup";
import { Search } from "./components/Search";
import { KampfPage } from "./pages/KampfPage";
import { OfflinePage } from "./pages/OfflinePage";
import { PokedexPage } from "./pages/PokedexPage";
import { PokemonPage } from "./pages/PokemonPage";
import { RanglistePage } from "./pages/RanglistePage";
import { TypenPage } from "./pages/TypenPage";

/** How long a restored row is held in place while the layout settles. */
const SETTLE_MS = 2500;

/** How often the row's position is checked during that window. */
const PIN_MS = 16;

/** Any of these means the user is scrolling themselves — stop correcting. */
const TAKEOVER = ["wheel", "touchstart", "pointerdown", "keydown"] as const;

/**
 * Client-side routing scrolls neither to top nor to anchors on its own:
 * plain navigations reset to the top, hash targets (/pokedex#p-25) are
 * scrolled into view once the grid is in the DOM, and coming back to a list
 * puts the row that was tapped back where it sat.
 *
 * The browser's own restoration is turned off rather than left to race with
 * this one — and it lands far off anyway, see lib/scroll.
 */
function ScrollManager() {
  const { pathname, hash, key } = useLocation();
  const lastPath = useRef<string | null>(null);

  useLayoutEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  }, []);

  useLayoutEffect(() => {
    const anchor = readAnchor(key);
    // Filter and sort taps replace the history entry, which hands out a fresh
    // key — so the effect re-runs without the page having changed at all.
    // Only a real page change is allowed to throw the scroll position away.
    const movedPage = lastPath.current !== pathname;
    lastPath.current = pathname;

    if (!anchor || !document.getElementById(anchor.id)) {
      if (hash) {
        const target = document.getElementById(hash.slice(1));
        if (target) {
          target.scrollIntoView({ block: "center" });
          return;
        }
      }
      if (movedPage) window.scrollTo(0, 0);
      return;
    }

    // Putting the row back once isn't enough: `content-visibility: auto` lets
    // the browser keep swapping estimated row heights for measured ones for
    // more than a second afterwards, and every swap above the viewport drags
    // everything below it along. So the row is held in place until the layout
    // has stopped moving — and released the moment the user takes over.
    // Looked up every tick rather than captured once: React re-renders the
    // list while the estimates are still settling and hands out a new DOM
    // node, and a captured reference would quietly go stale.
    const pin = () => {
      const row = document.getElementById(anchor.id);
      if (!row) return;
      const drift = row.getBoundingClientRect().top - anchor.top;
      if (Math.abs(drift) >= 1) window.scrollBy(0, drift);
    };
    const release = () => {
      clearInterval(ticker);
      clearTimeout(timer);
      for (const event of TAKEOVER) window.removeEventListener(event, release);
    };

    pin();
    // A timer rather than requestAnimationFrame: the correction has to keep
    // running while the tab is in the background too, and rAF is frozen there
    // — the row would then be left wherever the last re-layout dropped it.
    const ticker = window.setInterval(pin, PIN_MS);
    const timer = window.setTimeout(release, SETTLE_MS);
    for (const event of TAKEOVER) window.addEventListener(event, release, { passive: true });
    return release;
  }, [pathname, hash, key]);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <DexProvider>
        <ScrollManager />
        <header className="topbar">
          <Link to="/" className="logo">
            <PokeballIcon />
            <span className="logo-text">Better Dex</span>
          </Link>
          <nav className="top-links" aria-label="Hauptnavigation">
            <ListLink />
            <Link to="/typen" className="nav-pill">
              <MatrixIcon />
              <span>Typen</span>
            </Link>
            <Link to="/rangliste" className="nav-pill">
              <RankingIcon />
              <span>Rangliste</span>
            </Link>
            <Link to="/kampf" className="nav-pill">
              <SwordIcon />
              <span>Kampf</span>
            </Link>
            <Link to="/offline" className="nav-pill" aria-label="Offline und Downloads">
              <DownloadIcon />
            </Link>
          </nav>
          <Search />
        </header>
        <Routes>
          <Route path="/" element={<PokedexPage />} />
          <Route path="/pokedex" element={<PokedexPage />} />
          <Route path="/typen" element={<TypenPage />} />
          <Route path="/rangliste" element={<RanglistePage />} />
          <Route path="/kampf" element={<KampfPage />} />
          <Route path="/offline" element={<OfflinePage />} />
          <Route path="/pokemon/:id" element={<PokemonPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <PwaSetup />
      </DexProvider>
    </BrowserRouter>
  );
}
