import { useLayoutEffect } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { DexProvider } from "./DexProvider";
import { DownloadIcon, MatrixIcon, PokeballIcon } from "./components/icons";
import { ListLink } from "./components/ListLink";
import { PwaSetup } from "./components/PwaSetup";
import { Search } from "./components/Search";
import { OfflinePage } from "./pages/OfflinePage";
import { PokedexPage } from "./pages/PokedexPage";
import { PokemonPage } from "./pages/PokemonPage";
import { TypenPage } from "./pages/TypenPage";

/**
 * Client-side routing scrolls neither to top nor to anchors on its own:
 * plain navigations reset to the top, hash targets (/pokedex#p-25) are
 * scrolled into view once the grid is in the DOM.
 */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useLayoutEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ block: "center" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
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
          <Route path="/offline" element={<OfflinePage />} />
          <Route path="/pokemon/:id" element={<PokemonPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <PwaSetup />
      </DexProvider>
    </BrowserRouter>
  );
}
