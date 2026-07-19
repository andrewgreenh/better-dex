"use client";

import { useEffect, useState } from "react";
import { TYPE_NAMES_DE, TYPE_ORDER, type TypeName } from "@/lib/types";
import { TypeIcon } from "./icons";

/**
 * Type filter for the Pokédex list. Up to two types can be active at once
 * (a third tap replaces the oldest); only Pokémon that have ALL active
 * types stay visible. Filtering toggles `hidden` on the server-rendered
 * grid cells, so the static HTML and lazy images stay untouched.
 */
export function TypeFilterBar() {
  const [active, setActive] = useState<TypeName[]>([]);
  const [shown, setShown] = useState<number | null>(null);

  const toggle = (type: TypeName) => {
    setActive((current) =>
      current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type].slice(-2),
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
