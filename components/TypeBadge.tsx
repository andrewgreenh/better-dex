"use client";

import { speakGerman } from "@/lib/speech";
import { TYPE_NAMES_DE, type TypeName } from "@/lib/types";
import { TypeIcon } from "./icons";

/**
 * Type pill with color + icon + German name. Tapping it reads the
 * type name out loud — nice for kids who are still learning to read.
 */
export function TypeBadge({ type, small }: { type: TypeName; small?: boolean }) {
  const name = TYPE_NAMES_DE[type];
  return (
    <button
      type="button"
      className={`type-badge t-${type}${small ? " sm" : ""}`}
      onClick={() => speakGerman(name)}
      aria-label={`Typ ${name} vorlesen`}
    >
      <span className="ticon">
        <TypeIcon type={type} />
      </span>
      {name}
    </button>
  );
}
