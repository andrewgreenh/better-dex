import type { StatSet } from "./dex";

/**
 * The six base stats in canonical game order. `label` matches the wording on
 * the Pokémon page's stat chart; `short` is for the ranking's stat chips,
 * which are six-across on a phone.
 */
export const STAT_AXES: { key: keyof StatSet; label: string; short: string }[] = [
  { key: "hp", label: "KP", short: "KP" },
  { key: "attack", label: "Angriff", short: "ANG" },
  { key: "defense", label: "Vert.", short: "VER" },
  { key: "spAttack", label: "Sp.-Angr.", short: "SP-A" },
  { key: "spDefense", label: "Sp.-Vert.", short: "SP-V" },
  { key: "speed", label: "Init.", short: "INI" },
];

export type MetricKey = keyof StatSet | "total" | "totalRelevant";

export const METRICS: { key: MetricKey; label: string }[] = [
  ...STAT_AXES.map(({ key, label }) => ({ key: key as MetricKey, label })),
  { key: "total", label: "Gesamt" },
  { key: "totalRelevant", label: "Gesamt (relevant)" },
];

const METRIC_KEYS = new Set<string>(METRICS.map((metric) => metric.key));

export function isMetricKey(value: string | null): value is MetricKey {
  return value !== null && METRIC_KEYS.has(value);
}

/**
 * The attack stat a Pokémon actually fights with. "Gesamt (relevant)" drops
 * the other one: almost no Pokémon attacks with both, so the weaker of the
 * two is dead weight that flatters mixed spreads in the plain total.
 */
export function strongerAttack(stats: StatSet): "attack" | "spAttack" {
  return stats.spAttack > stats.attack ? "spAttack" : "attack";
}

export function statValue(stats: StatSet, metric: MetricKey): number {
  if (metric === "total") {
    return STAT_AXES.reduce((sum, axis) => sum + stats[axis.key], 0);
  }
  if (metric === "totalRelevant") {
    return stats.hp + stats.defense + stats.spDefense + stats.speed + stats[strongerAttack(stats)];
  }
  return stats[metric];
}
