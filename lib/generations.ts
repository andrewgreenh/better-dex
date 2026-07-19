/**
 * Main-series games grouped by generation, with German names.
 * Version slugs match PokeAPI's `version.name` used in the encounters endpoint,
 * so the encounter map can be keyed and filtered by these slugs directly.
 */
export interface GameVersion {
  slug: string;
  label: string;
}

export interface Generation {
  id: number;
  label: string;
  versions: GameVersion[];
}

export const GENERATIONS: Generation[] = [
  {
    id: 1,
    label: "1. Generation",
    versions: [
      { slug: "red", label: "Rot" },
      { slug: "blue", label: "Blau" },
      { slug: "yellow", label: "Gelb" },
    ],
  },
  {
    id: 2,
    label: "2. Generation",
    versions: [
      { slug: "gold", label: "Gold" },
      { slug: "silver", label: "Silber" },
      { slug: "crystal", label: "Kristall" },
    ],
  },
  {
    id: 3,
    label: "3. Generation",
    versions: [
      { slug: "ruby", label: "Rubin" },
      { slug: "sapphire", label: "Saphir" },
      { slug: "emerald", label: "Smaragd" },
      { slug: "firered", label: "Feuerrot" },
      { slug: "leafgreen", label: "Blattgrün" },
    ],
  },
  {
    id: 4,
    label: "4. Generation",
    versions: [
      { slug: "diamond", label: "Diamant" },
      { slug: "pearl", label: "Perl" },
      { slug: "platinum", label: "Platin" },
      { slug: "heartgold", label: "HeartGold" },
      { slug: "soulsilver", label: "SoulSilver" },
    ],
  },
  {
    id: 5,
    label: "5. Generation",
    versions: [
      { slug: "black", label: "Schwarz" },
      { slug: "white", label: "Weiß" },
      { slug: "black-2", label: "Schwarz 2" },
      { slug: "white-2", label: "Weiß 2" },
    ],
  },
  {
    id: 6,
    label: "6. Generation",
    versions: [
      { slug: "x", label: "X" },
      { slug: "y", label: "Y" },
      { slug: "omega-ruby", label: "Omega-Rubin" },
      { slug: "alpha-sapphire", label: "Alpha-Saphir" },
    ],
  },
  {
    id: 7,
    label: "7. Generation",
    versions: [
      { slug: "sun", label: "Sonne" },
      { slug: "moon", label: "Mond" },
      { slug: "ultra-sun", label: "Ultrasonne" },
      { slug: "ultra-moon", label: "Ultramond" },
      { slug: "lets-go-pikachu", label: "Let’s Go Pikachu" },
      { slug: "lets-go-eevee", label: "Let’s Go Evoli" },
    ],
  },
  {
    id: 8,
    label: "8. Generation",
    versions: [
      { slug: "sword", label: "Schwert" },
      { slug: "shield", label: "Schild" },
      { slug: "brilliant-diamond", label: "Strahlender Diamant" },
      { slug: "shining-pearl", label: "Leuchtende Perle" },
      { slug: "legends-arceus", label: "Legenden: Arceus" },
    ],
  },
  {
    id: 9,
    label: "9. Generation",
    versions: [
      { slug: "scarlet", label: "Karmesin" },
      { slug: "violet", label: "Purpur" },
    ],
  },
];

/**
 * Default game shown before the user picks one. Must be a game that actually
 * has encounter data (see below), otherwise every Pokémon looks uncatchable.
 */
export const DEFAULT_VERSION = "sword";

// PokeAPI has no wild-encounter data for these games — a gap in the data
// source, not the games themselves (you can absolutely catch Pokémon in them).
// Verified July 2026: BDSP, Legends: Arceus and Scarlet/Violet return no
// encounters for any Pokémon, so an empty result means "unknown", not "not
// catchable". Sword/Shield and Let's Go do have data.
const VERSIONS_WITHOUT_ENCOUNTER_DATA = new Set([
  "brilliant-diamond",
  "shining-pearl",
  "legends-arceus",
  "scarlet",
  "violet",
]);

/** Whether our data source knows any wild encounters for this game at all. */
export function hasEncounterData(slug: string): boolean {
  return !VERSIONS_WITHOUT_ENCOUNTER_DATA.has(slug);
}

const LABEL_BY_SLUG: Record<string, string> = Object.fromEntries(
  GENERATIONS.flatMap((gen) => gen.versions.map((v) => [v.slug, v.label])),
);

/** German game name for a version slug, falling back to the raw slug. */
export function versionLabel(slug: string): string {
  return LABEL_BY_SLUG[slug] ?? slug;
}

const SELECTABLE = new Set(Object.keys(LABEL_BY_SLUG));

// PokeAPI splits DLC and regional releases into their own version slugs. Fold
// them into the base game the picker offers, so those catch locations stay
// reachable when you select "Schwert", "Karmesin", etc.
const VERSION_ALIASES: Record<string, string> = {
  "the-isle-of-armor-sword": "sword",
  "the-crown-tundra-sword": "sword",
  "the-isle-of-armor-shield": "shield",
  "the-crown-tundra-shield": "shield",
  "the-teal-mask-scarlet": "scarlet",
  "the-indigo-disk-scarlet": "scarlet",
  "the-teal-mask-violet": "violet",
  "the-indigo-disk-violet": "violet",
  "red-japan": "red",
  "green-japan": "blue",
  "blue-japan": "blue",
};

/**
 * Map a raw PokeAPI version slug onto a selectable game, or `null` for titles
 * the picker doesn't list (spin-offs like Colosseum/XD, unreleased games).
 */
export function normalizeVersion(slug: string): string | null {
  const canonical = VERSION_ALIASES[slug] ?? slug;
  return SELECTABLE.has(canonical) ? canonical : null;
}
