"use client";

import { useState } from "react";
import { TYPE_CHART, TYPE_NAMES_DE, TYPE_ORDER, type TypeName } from "@/lib/types";
import { TypeIcon } from "./icons";

interface Focus {
  row: number;
  col: number;
}

function multiplierClass(attacker: TypeName, defender: TypeName): string {
  const multiplier = TYPE_CHART[attacker][defender] ?? 1;
  if (multiplier === 2) return "m-2";
  if (multiplier === 0.5) return "m-05";
  if (multiplier === 0) return "m-0";
  return "m-1";
}

function multiplierText(attacker: TypeName, defender: TypeName): string {
  const multiplier = TYPE_CHART[attacker][defender] ?? 1;
  if (multiplier === 2) return "2";
  if (multiplier === 0.5) return "½";
  if (multiplier === 0) return "0";
  return "";
}

/**
 * The 18×18 chart with row + column highlighting: hovering previews,
 * tapping pins (tap again to release) — so it works on iPad too.
 */
export function TypeMatrix() {
  const [hovered, setHovered] = useState<Focus | null>(null);
  const [pinned, setPinned] = useState<Focus | null>(null);
  const active = hovered ?? pinned;

  const toggle = (focus: Focus) => {
    setPinned((current) =>
      current && current.row === focus.row && current.col === focus.col ? null : focus,
    );
  };

  const cellClass = (row: number, col: number, base: string): string => {
    if (!active) return base;
    const inRow = active.row === row && row >= 0;
    const inCol = active.col === col && col >= 0;
    if (inRow && inCol) return `${base} hl-cross`;
    if (inRow || inCol) return `${base} hl`;
    return `${base} dim`;
  };

  return (
    <table className="matrix" onMouseLeave={() => setHovered(null)}>
      <thead>
        <tr>
          <th className="corner">
            <span>Angriff ↓</span>
            <span>Abwehr →</span>
          </th>
          {TYPE_ORDER.map((type, col) => (
            <th
              key={type}
              scope="col"
              className={cellClass(-1, col, "")}
              onMouseEnter={() => setHovered({ row: -1, col })}
              onClick={() => toggle({ row: -1, col })}
            >
              <span className={`mchip t-${type}`} title={TYPE_NAMES_DE[type]}>
                <TypeIcon type={type} />
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {TYPE_ORDER.map((attacker, row) => (
          <tr key={attacker}>
            <th
              scope="row"
              className={cellClass(row, -1, "")}
              onMouseEnter={() => setHovered({ row, col: -1 })}
              onClick={() => toggle({ row, col: -1 })}
            >
              <span className={`mchip t-${attacker}`}>
                <TypeIcon type={attacker} />
              </span>
              <span className="mname">{TYPE_NAMES_DE[attacker]}</span>
            </th>
            {TYPE_ORDER.map((defender, col) => (
              <td
                key={defender}
                className={cellClass(row, col, multiplierClass(attacker, defender))}
                title={`${TYPE_NAMES_DE[attacker]} → ${TYPE_NAMES_DE[defender]}: ${multiplierText(attacker, defender) || "1"}×`}
                onMouseEnter={() => setHovered({ row, col })}
                onClick={() => toggle({ row, col })}
              >
                {multiplierText(attacker, defender)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
