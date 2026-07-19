import { createContext, useContext } from "react";
import type { TypeName } from "./types";

const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

/** The six base stats, in canonical game order. */
export interface StatSet {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
}

/** One displayable form (Normal/Mega/Gigadynamax/regional) as stored in dex.json. */
export interface DexVariant {
  key: string;
  label: string;
  /** Pokémon id the artwork lives under (differs from the species id for forms). */
  imageId: number;
  types: TypeName[];
  stats: StatSet;
}

export interface EvolutionNode {
  id: number;
  name: string;
  /** German condition label on the arrow pointing at this node. */
  condition?: string;
  evolvesTo: EvolutionNode[];
}

/** German catch locations grouped by game version slug (e.g. "scarlet" → ["Route 2", …]). */
export type EncounterMap = Record<string, string[]>;

export interface DexPokemon {
  id: number;
  name: string;
  /** Default-form types (used by the list filter). */
  types: TypeName[];
  variants: DexVariant[];
  evolution: EvolutionNode;
  encounters: EncounterMap;
}

export interface DexData {
  generatedAt: string;
  pokemon: DexPokemon[];
}

/** The whole Pokédex, loaded once at startup and held in memory. */
export interface DexStore {
  pokemon: DexPokemon[];
  byId: Map<number, DexPokemon>;
  maxId: number;
}

export function buildStore(data: DexData): DexStore {
  const byId = new Map(data.pokemon.map((p) => [p.id, p]));
  return { pokemon: data.pokemon, byId, maxId: data.pokemon[data.pokemon.length - 1].id };
}

export const DexContext = createContext<DexStore | null>(null);

export function useDex(): DexStore {
  const store = useContext(DexContext);
  if (!store) throw new Error("useDex must be used inside DexProvider");
  return store;
}

export function artworkUrl(pokemonId: number): string {
  return `${SPRITES}/other/official-artwork/${pokemonId}.png`;
}

export function shinyArtworkUrl(pokemonId: number): string {
  return `${SPRITES}/other/official-artwork/shiny/${pokemonId}.png`;
}

export function spriteUrl(pokemonId: number): string {
  return `${SPRITES}/${pokemonId}.png`;
}

export function formatDexNo(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}
