import { useEffect, useRef, useState } from "react";
import { TypeBadge } from "@/components/TypeBadge";
import { HeartIcon, ImpactIcon, TypeIcon } from "@/components/icons";
import { artworkUrl, useDex, type DexPokemon } from "@/lib/dex";
import { speakGerman } from "@/lib/speech";
import {
  HEARTS,
  PLAYER_NAMES,
  attackLabel,
  attacksFor,
  damageDie,
  dieLabel,
  effectFor,
  isCrit,
  other,
  type AttackResult,
  type BattleState,
  type PlayerId,
  type Side,
} from "@/lib/battle";

/** How long the die spins before it settles on the rolled face. */
const ROLL_MS = 900;

function Hearts({ value }: { value: number }) {
  return (
    <div className="hearts" aria-label={`${value} von ${HEARTS} Herzen`}>
      {Array.from({ length: HEARTS }, (_, index) => (
        <i key={index} className={index < value ? "heart" : "heart gone"}>
          <HeartIcon />
        </i>
      ))}
    </div>
  );
}

/**
 * One side's board: the Pokémon that is out, its hearts, and a dot per team
 * member. The dots deliberately show no sprites — the rest of the team stays
 * secret until it is sent out.
 */
function Board({
  player,
  side,
  entry,
  hearts,
  turn,
}: {
  player: PlayerId;
  side: Side;
  entry: DexPokemon;
  hearts: number;
  turn: boolean;
}) {
  return (
    <div className={`board p${player}${turn ? " turn" : ""}`}>
      <div className="board-info">
        <span className="board-player">{PLAYER_NAMES[player]}</span>
        <b className="board-name">{entry.name}</b>
        <span className="board-types">
          {entry.types.map((type) => (
            <TypeBadge key={type} type={type} small />
          ))}
        </span>
        <Hearts value={hearts} />
        {side.team.length > 1 && (
          <span className="board-dots" aria-label="Pokémon übrig">
            {side.team.map((member, index) => (
              <i key={index} className={member.hearts > 0 ? "dot" : "dot out"} />
            ))}
          </span>
        )}
      </div>
      <img className="board-art" src={artworkUrl(entry.id)} alt={entry.name} width={200} height={200} />
    </div>
  );
}

/**
 * The fight itself. The whole board is public — both players are looking at
 * the same phone — so there are no hand-over screens between turns, just a
 * big coloured bar saying whose turn it is.
 */
export function Arena({
  state,
  onAttack,
  onConfirm,
}: {
  state: BattleState;
  onAttack: (result: AttackResult) => void;
  onConfirm: () => void;
}) {
  const { byId } = useDex();
  const result = state.result;

  /** The attack in flight while its die is still spinning. */
  const [roll, setRoll] = useState<{ faces: number[]; result: AttackResult } | null>(null);
  const [face, setFace] = useState(0);
  const land = useRef(onAttack);
  land.current = onAttack;

  useEffect(() => {
    if (!roll) return;
    let step = 0;
    const spin = setInterval(() => {
      step += 1;
      setFace(roll.faces[step % roll.faces.length]);
    }, 90);
    const settle = setTimeout(() => {
      clearInterval(spin);
      land.current(roll.result);
      setRoll(null);
    }, ROLL_MS);
    return () => {
      clearInterval(spin);
      clearTimeout(settle);
    };
  }, [roll]);

  useEffect(() => {
    if (!result || !state.speak) return;
    const attacker = byId.get(result.attackerId)?.name ?? "";
    const defender = byId.get(result.defenderId)?.name ?? "";
    speakGerman(
      `${attacker} setzt ${result.attack.name} ein. ` +
        (result.crit ? "Volltreffer! " : "") +
        result.effect.shout +
        (result.fainted ? ` ${defender} ist besiegt!` : ""),
    );
  }, [result, state.speak, byId]);

  const attacker = state.player;
  const defender = other(attacker);
  const sides = state.sides;
  const attackerMember = sides[attacker].team[sides[attacker].active];
  const defenderMember = sides[defender].team[sides[defender].active];
  const attackerEntry = byId.get(attackerMember.id);
  const defenderEntry = byId.get(defenderMember.id);
  if (!attackerEntry || !defenderEntry) return null;

  const attacks = attacksFor(attackerEntry.types);

  const strike = (index: number) => {
    if (roll) return;
    const attack = attacks[index];
    const faces = damageDie(attack, defenderEntry.types);
    const rolled = faces[Math.floor(Math.random() * faces.length)];
    const payload: AttackResult = {
      attacker,
      attackerId: attackerEntry.id,
      defenderId: defenderEntry.id,
      attack,
      effect: effectFor(attack, defenderEntry.types),
      crit: isCrit(faces, rolled),
      damage: Math.min(rolled, defenderMember.hearts),
      fainted: false,
    };
    // A one-faced die has nothing to show — an immune hit or a knockout
    // lands straight away instead of pretending there was suspense.
    if (faces.length === 1) {
      onAttack(payload);
      return;
    }
    setFace(faces[0]);
    setRoll({ faces, result: payload });
  };

  // Fixed seats — Spieler 1 always on top — so nothing jumps around between
  // turns; the coloured frame marks whose turn it is instead.
  const seats: PlayerId[] = [0, 1];

  return (
    <div className="arena">
      {seats.map((seat) => {
        const member = sides[seat].team[sides[seat].active];
        const entry = byId.get(member.id);
        return entry ? (
          <Board
            key={seat}
            player={seat}
            side={sides[seat]}
            entry={entry}
            hearts={member.hearts}
            turn={seat === attacker && !result}
          />
        ) : null;
      })}

      {roll ? (
        <div className="shout rolling" role="status">
          <b className="shout-move">
            {attackerEntry.name} setzt {roll.result.attack.name} ein!
          </b>
          <span className="die">{face}</span>
          <span className="shout-effect">Wie viele Herzen?</span>
        </div>
      ) : result ? (
        <div className={`shout tone-${result.effect.tone}`} role="status">
          <b className="shout-move">
            {byId.get(result.attackerId)?.name} setzt {result.attack.name} ein!
          </b>
          {result.crit && <span className="shout-crit">Volltreffer!</span>}
          <span className="shout-effect">{result.effect.shout}</span>
          <span className="shout-damage">
            {result.damage === 0
              ? "Kein Schaden"
              : `−${result.damage} ${result.damage === 1 ? "Herz" : "Herzen"}`}
          </span>
          {result.fainted && (
            <span className="shout-ko">{byId.get(result.defenderId)?.name} ist besiegt!</span>
          )}
          <button type="button" className="shout-next" onClick={onConfirm}>
            Weiter
          </button>
        </div>
      ) : (
        <div className={`actions p${attacker}`}>
          <p className="actions-turn">{PLAYER_NAMES[attacker]} ist dran — wähle einen Angriff</p>
          <div className="attack-list">
            {attacks.map((attack, index) => {
              const effect = effectFor(attack, defenderEntry.types);
              return (
                <button
                  key={attack.name}
                  type="button"
                  className={`attack${attack.type ? ` t-${attack.type}` : " plainmove"}`}
                  aria-label={attackLabel(attack)}
                  onClick={() => strike(index)}
                >
                  {/* Colour and glyph carry the type, the way the games show
                      their move lists — no type name spelled out. */}
                  <span className="ticon">
                    {attack.type ? <TypeIcon type={attack.type} /> : <ImpactIcon />}
                  </span>
                  <b>{attack.name}</b>
                  {state.hints && (
                    <span className={`attack-hint tone-${effect.tone}`}>
                      {effect.label} · {dieLabel(damageDie(attack, defenderEntry.types))} ♥
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
