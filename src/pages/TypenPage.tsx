import { TypeMatrix } from "@/components/TypeMatrix";
import { usePageTitle } from "@/lib/title";

export function TypenPage() {
  usePageTitle("Typen-Tabelle – Better Dex");
  return (
    <main className="content-page">
      <div className="page-head">
        <h1>Typen-Tabelle</h1>
        <p>
          Zeilen greifen an, Spalten verteidigen: Wie stark trifft eine{" "}
          <b>Feuer</b>-Attacke ein <b>Pflanzen</b>-Pokémon? 2×! Tippe auf eine
          Zelle, um Zeile und Spalte hervorzuheben.
        </p>
        <div className="matrix-legend">
          <span><i className="m-2">2</i> doppelt so stark</span>
          <span><i className="m-05">½</i> nur halb so stark</span>
          <span><i className="m-0">0</i> wirkt gar nicht</span>
        </div>
      </div>
      <div className="matrix-card">
        <div className="matrix-scroll">
          <TypeMatrix />
        </div>
      </div>
    </main>
  );
}
