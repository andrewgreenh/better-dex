import { TypeBadge } from "@/components/TypeBadge";
import { artworkUrl, useDex } from "@/lib/dex";
import { HEARTS, PLAYER_NAMES, type BattlePokemon, type PlayerId } from "@/lib/battle";

/**
 * Choosing a Pokémon from your own team — used both for the opening lead and
 * for sending in the next one after a knockout. Fainted members stay visible
 * but can't be picked, so you can see what is left.
 */
export function TeamPicker({
  player,
  team,
  title,
  subtitle,
  onPick,
}: {
  player: PlayerId;
  team: BattlePokemon[];
  title: string;
  subtitle: string;
  onPick: (index: number) => void;
}) {
  const { byId } = useDex();

  return (
    <div className={`team-picker p${player}`}>
      <div className="page-head">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="team-choices">
        {team.map((member, index) => {
          const entry = byId.get(member.id);
          if (!entry) return null;
          const out = member.hearts === 0;
          return (
            <button
              key={index}
              type="button"
              className={`team-choice${out ? " out" : ""}`}
              disabled={out}
              onClick={() => onPick(index)}
            >
              <img src={artworkUrl(entry.id)} alt="" width={120} height={120} />
              <b>{entry.name}</b>
              <span className="team-choice-types">
                {entry.types.map((type) => (
                  <TypeBadge key={type} type={type} small plain />
                ))}
              </span>
              <span className="team-choice-hp">
                {out ? "besiegt" : `${member.hearts} von ${HEARTS} Herzen`}
              </span>
            </button>
          );
        })}
      </div>
      <p className="team-picker-note">{PLAYER_NAMES[player]} wählt.</p>
    </div>
  );
}
