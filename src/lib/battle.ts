import { TYPE_CHART, TYPE_NAMES_DE, type TypeName } from "./types";

/**
 * Two-player hot-seat battle, played on one phone.
 *
 * The dex bundle carries no move data, so every Pokémon fights with its own
 * types: one attack per type plus "Rempler", a typeless shove that always
 * lands for 1 heart (without it, Normal vs. Geist would be a stalemate —
 * both immune to each other). Damage depends *only* on the type chart, never
 * on the attacker's stats, so any Pokémon can beat any other with the right
 * matchup. Stats matter in exactly one place: the faster one starts.
 */

/** Every Pokémon enters the battle with the same amount of hearts. */
export const HEARTS = 8;

/** One canonical German move name per type. */
const MOVE_NAMES: Record<TypeName, string> = {
  normal: "Bodycheck",
  fire: "Flammenwurf",
  water: "Aquaknarre",
  electric: "Donnerschock",
  grass: "Rankenhieb",
  ice: "Eisstrahl",
  fighting: "Karateschlag",
  poison: "Matschbombe",
  ground: "Erdbeben",
  flying: "Windstoß",
  psychic: "Konfusion",
  bug: "Käferbiss",
  rock: "Steinwurf",
  ghost: "Spukball",
  dragon: "Drachenwut",
  dark: "Biss",
  steel: "Metallklaue",
  fairy: "Feenbrise",
};

/** `type: null` is the Rempler — no type, no chart, always 1 heart. */
export interface Attack {
  name: string;
  type: TypeName | null;
}

export function attacksFor(types: TypeName[]): Attack[] {
  return [
    ...types.map((type) => ({ name: MOVE_NAMES[type], type })),
    { name: "Rempler", type: null },
  ];
}

export function multiplierFor(attack: Attack, defenderTypes: TypeName[]): number {
  const attacking = attack.type;
  if (!attacking) return 1;
  return defenderTypes.reduce(
    (acc, defender) => acc * (TYPE_CHART[attacking][defender] ?? 1),
    1,
  );
}

/**
 * The faces of the damage die for a matchup. Every attack is rolled instead
 * of dealing a fixed amount: a neutral round used to be the same tap five
 * times with a knowable ending, and a die turns each of those taps into a
 * moment. Faces repeat to weight the die — the highest one is the
 * "Volltreffer" and comes up about one roll in five.
 *
 * The ranges barely overlap, so the type lesson survives the randomness:
 * 4× knocks out at once, 2× always in two, a plain hit needs two to four.
 */
export function damageDie(attack: Attack, defenderTypes: TypeName[]): number[] {
  if (!attack.type) return [1, 1, 2];
  const multiplier = multiplierFor(attack, defenderTypes);
  if (multiplier === 0) return [0];
  if (multiplier < 1) return [1, 1, 1, 2];
  if (multiplier === 1) return [2, 2, 3, 3, 4];
  if (multiplier === 2) return [4, 4, 5, 5, 6];
  return [HEARTS];
}

/**
 * Whether a roll counts as a "Volltreffer". The top face of a weak die is
 * two hearts, and cheering that while the banner says the attack barely did
 * anything reads as a contradiction — so only real dice get the fanfare.
 */
export function isCrit(faces: number[], rolled: number): boolean {
  const top = faces[faces.length - 1];
  return faces.length > 1 && rolled === top && top >= 3;
}

/** "3" for a single-faced die, "2–4" for a range — for the attack buttons. */
export function dieLabel(faces: number[]): string {
  const low = faces[0];
  const high = faces[faces.length - 1];
  return low === high ? `${low}` : `${low}–${high}`;
}

export type EffectTone = "mega" | "super" | "plain" | "weak" | "none";

export interface Effect {
  tone: EffectTone;
  /** Short label for the attack button. */
  label: string;
  /** Full sentence for the result banner and the read-aloud voice. */
  shout: string;
}

export function effectFor(attack: Attack, defenderTypes: TypeName[]): Effect {
  if (!attack.type) return { tone: "plain", label: "Geht immer", shout: "Ein kleiner Schubser." };
  const multiplier = multiplierFor(attack, defenderTypes);
  if (multiplier >= 4) return { tone: "mega", label: "Mega!", shout: "Mega effektiv!" };
  if (multiplier === 2) return { tone: "super", label: "Sehr gut", shout: "Sehr effektiv!" };
  if (multiplier === 1) return { tone: "plain", label: "Normal", shout: "Ein Treffer." };
  if (multiplier > 0) return { tone: "weak", label: "Schwach", shout: "Das wirkt kaum." };
  return { tone: "none", label: "Wirkt nicht", shout: "Das wirkt überhaupt nicht!" };
}

export function attackLabel(attack: Attack): string {
  return attack.type ? `${attack.name} (${TYPE_NAMES_DE[attack.type]})` : attack.name;
}

/* ---------- state ---------- */

export type PlayerId = 0 | 1;

export const PLAYER_NAMES: Record<PlayerId, string> = { 0: "Spieler 1", 1: "Spieler 2" };

export function other(player: PlayerId): PlayerId {
  return player === 0 ? 1 : 0;
}

export interface BattlePokemon {
  /** Dex id — everything else is looked up in the dex store. */
  id: number;
  hearts: number;
}

export interface Side {
  team: BattlePokemon[];
  /** Index into `team`; -1 until the lead has been chosen. */
  active: number;
}

export type Phase = "setup" | "pass" | "draft" | "lead" | "reveal" | "battle" | "switch" | "over";

/** What just happened, shown as a banner until the player taps "Weiter". */
export interface AttackResult {
  attacker: PlayerId;
  attackerId: number;
  defenderId: number;
  attack: Attack;
  effect: Effect;
  crit: boolean;
  damage: number;
  fainted: boolean;
}

export interface BattleState {
  phase: Phase;
  /** The phase the pass screen hands over to. */
  next: Phase;
  /** Whose screen it is: who drafts, chooses or attacks. */
  player: PlayerId;
  teamSize: number;
  /** Show on every attack button how well it will work. */
  hints: boolean;
  /** Read the result out loud. */
  speak: boolean;
  sides: [Side, Side];
  result: AttackResult | null;
  winner: PlayerId | null;
}

export const INITIAL: BattleState = {
  phase: "setup",
  next: "setup",
  player: 0,
  teamSize: 3,
  hints: true,
  speak: true,
  sides: [
    { team: [], active: -1 },
    { team: [], active: -1 },
  ],
  result: null,
  winner: null,
};

export type BattleAction =
  | { type: "start"; teamSize: number; hints: boolean; speak: boolean }
  | { type: "handOver" }
  | { type: "pick"; id: number }
  | { type: "lead"; index: number }
  | { type: "go"; first: PlayerId }
  | { type: "attack"; result: AttackResult }
  | { type: "confirm" }
  | { type: "send"; index: number }
  | { type: "again" }
  | { type: "quit" };

/** How many Pokémon have been drafted in total — the draft alternates on it. */
export function picked(state: BattleState): number {
  return state.sides[0].team.length + state.sides[1].team.length;
}

function withSide(state: BattleState, player: PlayerId, side: Side): [Side, Side] {
  return player === 0 ? [side, state.sides[1]] : [state.sides[0], side];
}

/**
 * Pure — the crit roll and both dex lookups (damage, who is faster) happen in
 * the components, so React can call this twice without changing the outcome.
 */
export function battleReducer(state: BattleState, action: BattleAction): BattleState {
  switch (action.type) {
    case "start":
      return {
        ...INITIAL,
        teamSize: action.teamSize,
        hints: action.hints,
        speak: action.speak,
        phase: "pass",
        next: "draft",
      };

    case "handOver":
      return { ...state, phase: state.next };

    case "pick": {
      const side = state.sides[state.player];
      const sides = withSide(state, state.player, {
        ...side,
        team: [...side.team, { id: action.id, hearts: HEARTS }],
      });
      const done = sides[0].team.length + sides[1].team.length >= state.teamSize * 2;

      // A single Pokémon leaves nothing to choose — straight into the reveal.
      if (done && state.teamSize === 1) {
        return {
          ...state,
          sides: [
            { ...sides[0], active: 0 },
            { ...sides[1], active: 0 },
          ],
          phase: "reveal",
        };
      }
      return {
        ...state,
        sides,
        phase: "pass",
        next: done ? "lead" : "draft",
        player: done ? 0 : other(state.player),
      };
    }

    case "lead": {
      const sides = withSide(state, state.player, {
        ...state.sides[state.player],
        active: action.index,
      });
      if (state.player === 0) {
        return { ...state, sides, phase: "pass", next: "lead", player: 1 };
      }
      return { ...state, sides, phase: "reveal" };
    }

    case "go":
      return { ...state, phase: "battle", player: action.first, result: null };

    case "attack": {
      const defender = other(action.result.attacker);
      const side = state.sides[defender];
      const team = side.team.map((entry, index) =>
        index === side.active
          ? { ...entry, hearts: Math.max(0, entry.hearts - action.result.damage) }
          : entry,
      );
      const fainted = team[side.active].hearts === 0;
      return {
        ...state,
        sides: withSide(state, defender, { ...side, team }),
        result: { ...action.result, fainted },
      };
    }

    case "confirm": {
      const result = state.result;
      if (!result) return state;
      const defender = other(result.attacker);
      if (!result.fainted) {
        return { ...state, result: null, player: defender };
      }
      const alive = state.sides[defender].team.some((entry) => entry.hearts > 0);
      if (!alive) {
        return { ...state, result: null, phase: "over", winner: result.attacker };
      }
      // The player who just lost a Pokémon sends in the next one and gets to
      // attack with it — a small comeback for whoever is behind. Picking it
      // means seeing the rest of that team, so it goes behind a hand-over
      // screen like every other look at secret information.
      return { ...state, result: null, phase: "pass", next: "switch", player: defender };
    }

    case "send": {
      const sides = withSide(state, state.player, {
        ...state.sides[state.player],
        active: action.index,
      });
      return { ...state, sides, phase: "battle" };
    }

    case "again":
      return {
        ...INITIAL,
        teamSize: state.teamSize,
        hints: state.hints,
        speak: state.speak,
        phase: "pass",
        next: "draft",
      };

    case "quit":
      return { ...INITIAL, teamSize: state.teamSize, hints: state.hints, speak: state.speak };
  }
}

/** Which pick the drafting player is on, 1-based, for "Pokémon 2 von 3". */
export function draftStep(state: BattleState): number {
  return state.sides[state.player].team.length + 1;
}

/* ---------- persistence ---------- */

/**
 * A mis-tap on the search field would otherwise throw away a half-drafted
 * game, so the whole state rides along in sessionStorage.
 */
const STORAGE_KEY = "better-dex:battle:1";

export function loadBattle(): BattleState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL;
    const parsed = JSON.parse(raw) as BattleState;
    if (typeof parsed?.phase !== "string" || !Array.isArray(parsed.sides)) return INITIAL;
    return parsed;
  } catch {
    return INITIAL;
  }
}

export function saveBattle(state: BattleState): void {
  try {
    if (state.phase === "setup") sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — the game just won't survive a reload */
  }
}
