import { memo, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { HighlightFromHash } from "@/components/HighlightFromHash";
import { TypeFilterBar, useTypeFilter } from "@/components/TypeFilterBar";
import { formatDexNo, spriteUrl, useDex } from "@/lib/dex";
import type { DexPokemon } from "@/lib/dex";

/**
 * One grid cell. A plain <a> rather than a <Link>: every Link subscribes to
 * router context and re-resolves its path, which a thousand at a time is
 * enough to be felt. Navigation is handled once, by the grid below.
 *
 * Memoised on (entry, hidden) so a filter change only re-renders the cells
 * that actually changed state, not all 1025.
 */
const Cell = memo(function Cell({ entry, hidden }: { entry: DexPokemon; hidden: boolean }) {
  return (
    <a id={`p-${entry.id}`} className="dex-cell" href={`/pokemon/${entry.id}`} hidden={hidden}>
      {/*
        Navigating back re-mounts the grid, and the sprites are then
        already cached — decoding them synchronously paints them with
        the first frame instead of flashing empty cells.
      */}
      <img src={spriteUrl(entry.id)} alt="" width={56} height={56} loading="lazy" decoding="sync" />
      <b>{entry.name}</b>
      <span>{formatDexNo(entry.id)}</span>
    </a>
  );
});

/** The full Pokédex grid with type filter — shared by / and /pokedex. */
export function PokedexList() {
  const { pokemon } = useDex();
  const { active } = useTypeFilter();
  const navigate = useNavigate();

  // One handler for the whole grid instead of one per cell. Modified clicks
  // are left alone so cmd/middle-click still open a new tab.
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const cell = (event.target as Element).closest("a.dex-cell");
    const href = cell?.getAttribute("href");
    if (!href) return;
    event.preventDefault();
    navigate(href);
  };

  // Every cell stays mounted and filtering only flips `hidden`. Mounting and
  // unmounting ~900 cells per toggle was the expensive part, and it happened
  // inside the router's transition — so the pills couldn't repaint until it
  // finished. Hiding costs an attribute write on the cells that changed.
  return (
    <main className="content-page">
      <HighlightFromHash />
      <div className="page-head">
        <h1>Alle Pokémon</h1>
      </div>
      <TypeFilterBar />
      <div className="dex-grid" onClick={onClick}>
        {pokemon.map((entry) => (
          <Cell
            key={entry.id}
            entry={entry}
            hidden={active.length > 0 && !active.every((type) => entry.types.includes(type))}
          />
        ))}
      </div>
    </main>
  );
}
