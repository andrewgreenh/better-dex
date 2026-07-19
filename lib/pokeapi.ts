import { cacheLife } from "next/cache";
import { computeEffectiveness, type EffectivenessBucket, type TypeName } from "./types";

const API = "https://pokeapi.co/api/v2";
const SPECIES_NAMES_CSV =
  "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv";
const POKEMON_TYPES_CSV =
  "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_types.csv";
const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

/** PokeAPI numeric type ids (order differs from our display order). */
const TYPE_BY_ID: Record<number, TypeName> = {
  1: "normal",
  2: "fighting",
  3: "flying",
  4: "poison",
  5: "ground",
  6: "rock",
  7: "bug",
  8: "ghost",
  9: "steel",
  10: "fire",
  11: "water",
  12: "grass",
  13: "electric",
  14: "psychic",
  15: "ice",
  16: "dragon",
  17: "dark",
  18: "fairy",
};

const GERMAN_LANGUAGE_ID = 6;

export interface Variant {
  key: string;
  label: string;
  image: string;
  types: TypeName[];
  effectiveness: EffectivenessBucket[];
}

export interface EvolutionNode {
  id: number;
  name: string;
  image: string;
  /** German condition label on the arrow pointing at this node. */
  condition?: string;
  evolvesTo: EvolutionNode[];
}

export interface NavTarget {
  id: number;
  name: string;
  sprite: string;
}

export interface PokemonPage {
  id: number;
  name: string;
  variants: Variant[];
  evolution: EvolutionNode;
  prev: NavTarget;
  next: NavTarget;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

/** German species names (id → name), parsed from the PokeAPI CSV. All other languages are discarded. */
export async function getGermanNames(): Promise<Record<number, string>> {
  "use cache";
  cacheLife("max");
  const res = await fetch(SPECIES_NAMES_CSV);
  if (!res.ok) throw new Error(`${res.status} for species names CSV`);
  const csv = await res.text();
  const names: Record<number, string> = {};
  for (const line of csv.split("\n")) {
    // pokemon_species_id,local_language_id,name,genus
    const [id, lang, name] = line.split(",");
    if (Number(lang) === GERMAN_LANGUAGE_ID && name) {
      names[Number(id)] = name.replaceAll('"', "");
    }
  }
  return names;
}

/**
 * Types of every default-form Pokémon (species id → type names, slot order),
 * parsed from the PokeAPI CSV — one request instead of 1025.
 */
export async function getTypesMap(): Promise<Record<number, TypeName[]>> {
  "use cache";
  cacheLife("max");
  const names = await getGermanNames();
  const res = await fetch(POKEMON_TYPES_CSV);
  if (!res.ok) throw new Error(`${res.status} for pokemon types CSV`);
  const csv = await res.text();
  const map: Record<number, TypeName[]> = {};
  for (const line of csv.split("\n")) {
    // pokemon_id,type_id,slot — default forms share the species id.
    const [pokemonId, typeId, slot] = line.split(",").map(Number);
    const type = TYPE_BY_ID[typeId];
    if (!type || !names[pokemonId]) continue;
    (map[pokemonId] ??= [])[slot - 1] = type;
  }
  return map;
}

export async function getAllSpeciesIds(): Promise<number[]> {
  const names = await getGermanNames();
  return Object.keys(names).map(Number);
}

export function artworkUrl(pokemonId: number): string {
  return `${SPRITES}/other/official-artwork/${pokemonId}.png`;
}

export function spriteUrl(pokemonId: number): string {
  return `${SPRITES}/${pokemonId}.png`;
}

interface ApiSpecies {
  id: number;
  varieties: { is_default: boolean; pokemon: { name: string; url: string } }[];
  evolution_chain: { url: string } | null;
}

interface ApiPokemon {
  id: number;
  types: { slot: number; type: { name: string } }[];
  sprites: { other?: { ["official-artwork"]?: { front_default?: string | null } } };
}

interface ApiChainLink {
  species: { name: string; url: string };
  evolution_details: ApiEvolutionDetail[];
  evolves_to: ApiChainLink[];
}

interface ApiEvolutionDetail {
  trigger: { name: string };
  min_level: number | null;
  min_happiness: number | null;
  item: { name: string } | null;
  held_item: { name: string } | null;
  time_of_day: string;
}

const ITEMS_DE: Record<string, string> = {
  "fire-stone": "Feuerstein",
  "water-stone": "Wasserstein",
  "thunder-stone": "Donnerstein",
  "leaf-stone": "Blattstein",
  "moon-stone": "Mondstein",
  "sun-stone": "Sonnenstein",
  "shiny-stone": "Leuchtstein",
  "dusk-stone": "Finsterstein",
  "dawn-stone": "Funkelstein",
  "ice-stone": "Eisstein",
  "oval-stone": "Ovaler Stein",
  "kings-rock": "King-Stein",
  "metal-coat": "Metallmantel",
  "dragon-scale": "Drachenschuppe",
  "linking-cord": "Verbindungsschnur",
  "black-augurite": "Schwarzaugit",
  "peat-block": "Torfblock",
  "razor-claw": "Scharfklaue",
  "razor-fang": "Scharfzahn",
  "prism-scale": "Schönschuppe",
  "whipped-dream": "Sahnehäubchen",
  sachet: "Duftbeutel",
  "sweet-apple": "Süßer Apfel",
  "tart-apple": "Saurer Apfel",
  "cracked-pot": "Rissige Kanne",
  electirizer: "Stromisierer",
  magmarizer: "Magmaisierer",
  protector: "Schützer",
  "reaper-cloth": "Zwielichtband",
  "dubious-disc": "Dubiosdisc",
  "up-grade": "Up-Grade",
};

function prettifyItem(item: string): string {
  return ITEMS_DE[item] ?? item.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("-");
}

function conditionLabel(details: ApiEvolutionDetail[]): string | undefined {
  const detail = details[0];
  if (!detail) return undefined;
  switch (detail.trigger.name) {
    case "level-up":
      if (detail.min_level) return `Lv. ${detail.min_level}`;
      if (detail.min_happiness) return "Freundschaft";
      return "Levelaufstieg";
    case "use-item":
      return detail.item ? prettifyItem(detail.item.name) : "Item";
    case "trade":
      return detail.held_item ? `Tausch + ${prettifyItem(detail.held_item.name)}` : "Tausch";
    default:
      return "Spezial";
  }
}

function idFromUrl(url: string): number {
  return Number(url.replace(/\/$/, "").split("/").pop());
}

const VARIANT_LABELS: [RegExp, string][] = [
  [/-mega-x$/, "Mega X"],
  [/-mega-y$/, "Mega Y"],
  [/-mega$/, "Mega"],
  [/-gmax$/, "Gigadynamax"],
];

function variantLabel(pokemonName: string): string | null {
  for (const [pattern, label] of VARIANT_LABELS) {
    if (pattern.test(pokemonName)) return label;
  }
  return null;
}

async function buildEvolutionNode(
  link: ApiChainLink,
  names: Record<number, string>,
  condition?: string,
): Promise<EvolutionNode> {
  const id = idFromUrl(link.species.url);
  return {
    id,
    name: names[id] ?? link.species.name,
    image: artworkUrl(id),
    condition,
    evolvesTo: await Promise.all(
      link.evolves_to.map((child) =>
        buildEvolutionNode(child, names, conditionLabel(child.evolution_details)),
      ),
    ),
  };
}

/** Everything one Pokémon page needs, fully cached at build time. */
export async function getPokemonPage(id: number): Promise<PokemonPage> {
  "use cache";
  cacheLife("max");

  const names = await getGermanNames();
  const maxId = Math.max(...Object.keys(names).map(Number));
  const species = await fetchJson<ApiSpecies>(`${API}/pokemon-species/${id}`);

  const varietyRefs = species.varieties.filter(
    (variety) => variety.is_default || variantLabel(variety.pokemon.name) !== null,
  );
  const variants: Variant[] = await Promise.all(
    varietyRefs.map(async (ref) => {
      const pokemon = await fetchJson<ApiPokemon>(ref.pokemon.url);
      const types = pokemon.types
        .sort((a, b) => a.slot - b.slot)
        .map((entry) => entry.type.name as TypeName);
      return {
        key: ref.pokemon.name,
        label: ref.is_default ? "Normal" : variantLabel(ref.pokemon.name) ?? "Form",
        image: pokemon.sprites.other?.["official-artwork"]?.front_default ?? artworkUrl(pokemon.id),
        types,
        effectiveness: computeEffectiveness(types),
      };
    }),
  );
  // Default form first, then Mega X/Y/Mega, then Gigadynamax.
  const order = ["Normal", "Mega", "Mega X", "Mega Y", "Gigadynamax"];
  variants.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));

  let evolution: EvolutionNode;
  if (species.evolution_chain) {
    const chain = await fetchJson<{ chain: ApiChainLink }>(species.evolution_chain.url);
    evolution = await buildEvolutionNode(chain.chain, names);
  } else {
    evolution = { id, name: names[id], image: artworkUrl(id), evolvesTo: [] };
  }

  const prevId = id === 1 ? maxId : id - 1;
  const nextId = id === maxId ? 1 : id + 1;

  return {
    id,
    name: names[id] ?? `#${id}`,
    variants,
    evolution,
    prev: { id: prevId, name: names[prevId], sprite: spriteUrl(prevId) },
    next: { id: nextId, name: names[nextId], sprite: spriteUrl(nextId) },
  };
}
