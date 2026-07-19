import { TYPE_NAMES_DE, type TypeName } from "@/lib/types";
import { TypeIcon } from "./icons";

export function TypeBadge({ type, small }: { type: TypeName; small?: boolean }) {
  return (
    <span className={`type-badge t-${type}${small ? " sm" : ""}`}>
      <span className="ticon">
        <TypeIcon type={type} />
      </span>
      {TYPE_NAMES_DE[type]}
    </span>
  );
}
