import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TYPE_NAMES_DE, TYPE_ORDER, type TypeName } from "@/lib/types";
import { TypeIcon } from "./icons";

/** Query parameter holding the active types, e.g. /pokedex?typ=fire&typ=flying. */
const PARAM = "typ";

/** Reads the selection back from the URL, ignoring anything hand-edited or stale. */
function parseTypes(values: string[]): TypeName[] {
  const known = new Set<string>(TYPE_ORDER);
  const types = values.filter((type) => known.has(type)) as TypeName[];
  return [...new Set(types)].slice(0, 2);
}

/**
 * Type filter for the Pokédex list. Up to two types can be active at once
 * (a third tap replaces the oldest); only Pokémon that have ALL active
 * types stay visible. Filtering toggles `hidden` on the rendered grid cells,
 * so the markup and lazy images stay untouched.
 *
 * The selection lives in the URL, so leaving for a Pokémon page and coming
 * back restores it. Filter taps replace the history entry — otherwise every
 * tap would need its own press of the back button.
 */
export function TypeFilterBar() {
  const [params, setParams] = useSearchParams();
  const active = useMemo(() => parseTypes(params.getAll(PARAM)), [params]);
  const [shown, setShown] = useState<number | null>(null);

  const setActive = (next: TypeName[]) => {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        updated.delete(PARAM);
        for (const type of next) updated.append(PARAM, type);
        return updated;
      },
      { replace: true },
    );
  };

  const toggle = (type: TypeName) => {
    setActive(
      active.includes(type)
        ? active.filter((t) => t !== type)
        : [...active, type].slice(-2),
    );
  };

  useEffect(() => {
    const cells = document.querySelectorAll<HTMLElement>(".dex-cell");
    let visible = 0;
    for (const cell of cells) {
      const types = (cell.dataset.types ?? "").split(" ");
      const match = active.every((type) => types.includes(type));
      cell.hidden = !match;
      if (match) visible += 1;
    }
    setShown(active.length > 0 ? visible : null);
  }, [active]);

  return (
    <div className="filter-bar" role="group" aria-label="Nach Typ filtern">
      {TYPE_ORDER.map((type) => {
        const isActive = active.includes(type);
        return (
          <button
            key={type}
            type="button"
            className={`filter-pill${isActive ? ` on t-${type}` : ""}`}
            aria-pressed={isActive}
            onClick={() => toggle(type)}
          >
            <span className="ticon">
              <TypeIcon type={type} />
            </span>
            {TYPE_NAMES_DE[type]}
          </button>
        );
      })}
      {shown !== null && (
        <span className="filter-count">
          {shown} Pokémon
          <button type="button" className="filter-clear" onClick={() => setActive([])}>
            Filter löschen
          </button>
        </span>
      )}
    </div>
  );
}
