import { Link } from "react-router-dom";
import { HighlightFromHash } from "@/components/HighlightFromHash";
import { TypeFilterBar } from "@/components/TypeFilterBar";
import { formatDexNo, spriteUrl, useDex } from "@/lib/dex";

/** The full Pokédex grid with type filter — shared by / and /pokedex. */
export function PokedexList() {
  const { pokemon } = useDex();

  return (
    <main className="content-page">
      <HighlightFromHash />
      <div className="page-head">
        <h1>Alle Pokémon</h1>
      </div>
      <TypeFilterBar />
      <div className="dex-grid">
        {pokemon.map((entry) => (
          <Link
            key={entry.id}
            id={`p-${entry.id}`}
            className="dex-cell"
            to={`/pokemon/${entry.id}`}
            data-types={entry.types.join(" ")}
          >
            <img src={spriteUrl(entry.id)} alt="" width={56} height={56} loading="lazy" decoding="async" />
            <b>{entry.name}</b>
            <span>{formatDexNo(entry.id)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
