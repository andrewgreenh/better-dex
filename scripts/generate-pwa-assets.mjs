/**
 * Prebuild step: generates public/precache-manifest.json and public/sw.js.
 *
 * The manifest lists every URL the service worker precaches:
 * - pages: all static routes + one per Pokémon species
 * - sprites: pixel sprites for all species (small, precached eagerly)
 * - artwork: official artwork, normal + shiny, for species and all displayed
 *   forms (mega/gmax/regional) — large, downloaded on demand
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const CSV_URL =
  "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv";
const POKEMON_LIST_URL = "https://pokeapi.co/api/v2/pokemon?limit=20000";
const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const GERMAN_LANGUAGE_ID = 6;
// Must mirror VARIANT_LABELS in lib/pokeapi.ts (which forms get their own variant chip).
const VARIANT_PATTERN =
  /-mega(-x|-y)?$|-gmax$|-alola$|-galar(-standard)?$|-hisui$|-paldea$|-paldea-(combat|blaze|aqua)-breed$/;

async function fetchOk(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return response;
}

// Species ids that have a German name (= every page we generate).
const csv = await (await fetchOk(CSV_URL)).text();
const speciesIds = [];
for (const line of csv.split("\n")) {
  const [id, lang] = line.split(",");
  if (Number(lang) === GERMAN_LANGUAGE_ID) speciesIds.push(Number(id));
}
speciesIds.sort((a, b) => a - b);

// Pokémon ids of mega/gmax/regional forms (their artwork lives under the form id).
const pokemonList = (await (await fetchOk(POKEMON_LIST_URL)).json()).results;
const variantIds = pokemonList
  .filter((entry) => !entry.name.includes("totem") && VARIANT_PATTERN.test(entry.name))
  .map((entry) => Number(entry.url.replace(/\/$/, "").split("/").pop()));

const artworkIds = [...speciesIds, ...variantIds];
const manifest = {
  generatedAt: new Date().toISOString(),
  pages: ["/", "/pokedex", "/typen", "/offline", ...speciesIds.map((id) => `/pokemon/${id}`)],
  sprites: speciesIds.map((id) => `${SPRITES}/${id}.png`),
  artwork: [
    ...artworkIds.map((id) => `${SPRITES}/other/official-artwork/${id}.png`),
    ...artworkIds.map((id) => `${SPRITES}/other/official-artwork/shiny/${id}.png`),
  ],
};

mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(join(root, "public", "precache-manifest.json"), JSON.stringify(manifest));

const template = readFileSync(join(root, "scripts", "sw-template.js"), "utf8");
const version = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
writeFileSync(join(root, "public", "sw.js"), template.replace(/__VERSION__/g, version));

console.log(
  `pwa-assets: ${manifest.pages.length} pages, ${manifest.sprites.length} sprites, ` +
    `${manifest.artwork.length} artwork files, sw version ${version}`,
);
