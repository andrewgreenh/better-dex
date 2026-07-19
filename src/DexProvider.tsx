import { useEffect, useState, type ReactNode } from "react";
import { buildStore, DexContext, type DexData, type DexStore } from "@/lib/dex";
import dexUrl from "@/generated/dex.json?url";

/**
 * Loads the complete Pokédex bundle (~300 KB gzipped) once at startup.
 * Every navigation afterwards is a pure in-memory route change — no fetches.
 * The service worker precaches the (content-hashed) bundle, so this also
 * works offline after the first visit.
 */
export function DexProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<DexStore | null>(null);
  const [failed, setFailed] = useState(false);

  const load = () => {
    setFailed(false);
    fetch(dexUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json() as Promise<DexData>;
      })
      .then((data) => setStore(buildStore(data)))
      .catch(() => setFailed(true));
  };

  useEffect(load, []);

  if (failed) {
    return (
      <div className="app-splash">
        <p>Der Pokédex konnte nicht geladen werden. Bist du offline?</p>
        <button type="button" onClick={load}>
          Nochmal versuchen
        </button>
      </div>
    );
  }

  if (!store) {
    return <div className="app-splash">Pokédex wird geladen …</div>;
  }

  return <DexContext.Provider value={store}>{children}</DexContext.Provider>;
}
