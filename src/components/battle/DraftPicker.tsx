import { memo, useMemo, useState, type MouseEvent } from "react";
import { TypeFilterBar, useTypeFilter } from "@/components/TypeFilterBar";
import { formatDexNo, spriteUrl, useDex, type DexPokemon } from "@/lib/dex";
import { PLAYER_NAMES, type PlayerId } from "@/lib/battle";
import { SearchIcon } from "@/components/icons";

/** Case- and diacritic-insensitive, same as the header search. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * One pickable cell. A button rather than the list's <a>: this grid picks a
 * team member instead of navigating. Memoised on (entry, hidden, taken) so
 * typing in the filter only re-renders the cells that changed.
 */
const Cell = memo(function Cell({
  entry,
  hidden,
  taken,
}: {
  entry: DexPokemon;
  hidden: boolean;
  taken: boolean;
}) {
  return (
    <button
      type="button"
      className="dex-cell pick-cell"
      data-id={entry.id}
      hidden={hidden}
      disabled={taken}
    >
      <img src={spriteUrl(entry.id)} alt="" width={56} height={56} loading="lazy" decoding="sync" />
      <b>{entry.name}</b>
      <span>{taken ? "im Team" : formatDexNo(entry.id)}</span>
    </button>
  );
});

/**
 * The full dex as a draft board — same filter and grid as the Pokédex list,
 * but tapping a cell adds it to the team. Already-drafted Pokémon are greyed
 * out for their own owner only; blocking the *opponent's* picks would leak
 * exactly the information the pass screens exist to hide.
 */
export function DraftPicker({
  player,
  step,
  teamSize,
  own,
  onPick,
}: {
  player: PlayerId;
  step: number;
  teamSize: number;
  own: number[];
  onPick: (id: number) => void;
}) {
  const { pokemon } = useDex();
  const { active } = useTypeFilter();
  const [query, setQuery] = useState("");

  const ownIds = useMemo(() => new Set(own), [own]);
  const search = normalize(query.trim());

  // Everything stays mounted and filtering only flips `hidden`, like the
  // Pokédex grid — mounting a thousand cells per keystroke is the slow part.
  const isHidden = (entry: DexPokemon) =>
    (active.length > 0 && !active.every((type) => entry.types.includes(type))) ||
    (search !== "" && !normalize(entry.name).includes(search));

  const shown = pokemon.reduce((count, entry) => (isHidden(entry) ? count : count + 1), 0);

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const cell = (event.target as Element).closest<HTMLElement>("button.pick-cell");
    const id = cell?.dataset.id;
    if (id) onPick(Number(id));
  };

  return (
    <div className={`draft p${player}`}>
      <div className="draft-head">
        <div>
          <h1>{PLAYER_NAMES[player]}, wähle dein Team</h1>
          <p>
            Pokémon {step} von {teamSize}
          </p>
        </div>
        <div className="draft-team">
          {Array.from({ length: teamSize }, (_, index) => {
            const id = own[index];
            return id === undefined ? (
              <span key={index} className="draft-slot empty">
                ?
              </span>
            ) : (
              <span key={index} className="draft-slot">
                <img src={spriteUrl(id)} alt="" width={44} height={44} />
              </span>
            );
          })}
        </div>
      </div>

      <div className="draft-search">
        <SearchIcon />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nach Namen suchen…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {query !== "" && (
          <button type="button" className="draft-search-clear" onClick={() => setQuery("")}>
            Löschen
          </button>
        )}
      </div>

      <TypeFilterBar />

      {shown === 0 ? (
        <p className="draft-empty">Keine Pokémon gefunden. Ändere die Suche oder den Filter.</p>
      ) : (
        <div className="dex-grid" onClick={onClick}>
          {pokemon.map((entry) => (
            <Cell
              key={entry.id}
              entry={entry}
              hidden={isHidden(entry)}
              taken={ownIds.has(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
