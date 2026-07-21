import { useMemo } from "react";
import { Link } from "react-router-dom";
import { HighlightFromHash } from "@/components/HighlightFromHash";
import { TypeFilterBar, useTypeFilter } from "@/components/TypeFilterBar";
import { formatDexNo, spriteUrl, useDex } from "@/lib/dex";

/** The full Pokédex grid with type filter — shared by / and /pokedex. */
export function PokedexList() {
  const { pokemon } = useDex();
  const { active } = useTypeFilter();

  // Filtering during render (rather than hiding cells afterwards) keeps the
  // grid from flashing its full contents for a frame on every mount.
  const visible = useMemo(
    () =>
      active.length === 0
        ? pokemon
        : pokemon.filter((entry) => active.every((type) => entry.types.includes(type))),
    [pokemon, active],
  );

  return (
    <main className="content-page">
      <HighlightFromHash />
      <div className="page-head">
        <h1>Alle Pokémon</h1>
      </div>
      <TypeFilterBar shown={active.length > 0 ? visible.length : null} />
      <div className="dex-grid">
        {visible.map((entry) => (
          <Link
            key={entry.id}
            id={`p-${entry.id}`}
            className="dex-cell"
            to={`/pokemon/${entry.id}`}
          >
            {/*
              Navigating back re-mounts the grid, and the sprites are then
              already cached — decoding them synchronously paints them with
              the first frame instead of flashing empty cells.
            */}
            <img src={spriteUrl(entry.id)} alt="" width={56} height={56} loading="lazy" decoding="sync" />
            <b>{entry.name}</b>
            <span>{formatDexNo(entry.id)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
