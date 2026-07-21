import { useMemo } from "react";
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
 * The type selection, kept in the URL so leaving for a Pokémon page and
 * coming back restores it. Filter taps replace the history entry — otherwise
 * every tap would need its own press of the back button.
 */
export function useTypeFilter() {
  const [params, setParams] = useSearchParams();
  const active = useMemo(() => parseTypes(params.getAll(PARAM)), [params]);

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

  return { active, setActive };
}

/**
 * Type filter for the Pokédex list. Up to two types can be active at once
 * (a third tap replaces the oldest); the list renders only Pokémon that have
 * ALL of them. `shown` is the resulting count, or null while unfiltered.
 */
export function TypeFilterBar({ shown }: { shown: number | null }) {
  const { active, setActive } = useTypeFilter();

  const toggle = (type: TypeName) => {
    setActive(
      active.includes(type)
        ? active.filter((t) => t !== type)
        : [...active, type].slice(-2),
    );
  };

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
