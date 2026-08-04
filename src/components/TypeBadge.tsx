import { speakGerman } from "@/lib/speech";
import { TYPE_NAMES_DE, type TypeName } from "@/lib/types";
import { TypeIcon } from "./icons";

/**
 * Type pill with color + icon + German name. Tapping it reads the type name
 * out loud — nice for kids who are still learning to read. `plain` drops the
 * button and renders a span instead, for the places where the badge sits
 * inside something else that is already tappable.
 */
export function TypeBadge({
  type,
  small,
  plain,
}: {
  type: TypeName;
  small?: boolean;
  plain?: boolean;
}) {
  const name = TYPE_NAMES_DE[type];
  const className = `type-badge t-${type}${small ? " sm" : ""}`;
  const content = (
    <>
      <span className="ticon">
        <TypeIcon type={type} />
      </span>
      {name}
    </>
  );

  if (plain) return <span className={className}>{content}</span>;

  return (
    <button
      type="button"
      className={className}
      onClick={() => speakGerman(name)}
      aria-label={`Typ ${name} vorlesen`}
    >
      {content}
    </button>
  );
}
