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

    // One correction is enough, and only because the list rows are a fixed
    // height: the browser's estimate for the rows it skipped is then exactly
    // right, so nothing shifts underneath afterwards. See .rank-row and
    // .dex-cell — if those heights ever go back to being content-sized, this
    // lands in the right place and then slides away again.
    const row = document.getElementById(anchor.id)!;
    window.scrollBy(0, row.getBoundingClientRect().top - anchor.top);
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
