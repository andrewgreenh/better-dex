/**
 * Build step: generates the complete Pokédex dataset as one static JSON bundle.
 *
 * - src/generated/dex.json — everything the app needs (names, variants, stats,
 *   evolutions, encounters), ~1.2 MB raw. Imported as a hashed asset and
 *   fetched once at app startup; the client never talks to PokeAPI.
 * - public/image-manifest.json — sprite/artwork URL lists for the service
 *   worker's offline image download.
 *
 * Every PokeAPI response is cached on disk (node_modules/.cache/dexgen), so
 * only the first run is slow. `--force` ignores the existing output,
 * `--skip-if-exists` exits early when the bundle is already there (dev).
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DATA = join(root, "src", "generated", "dex.json");
const OUT_IMAGES = join(root, "public", "image-manifest.json");
const CACHE_DIR = join(root, "node_modules", ".cache", "dexgen");

const API = "https://pokeapi.co/api/v2";
const SPECIES_NAMES_CSV =
  "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species_names.csv";
const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const GERMAN_LANGUAGE_ID = 6;

if (process.argv.includes("--skip-if-exists") && existsSync(OUT_DATA) && existsSync(OUT_IMAGES)) {
  console.log("dex-data: bundle exists, skipping (run `npm run data` to refresh)");
  process.exit(0);
}

/* ---------- cached fetching with a small concurrency pool ---------- */

mkdirSync(CACHE_DIR, { recursive: true });

let inFlight = 0;
const queue = [];
const CONCURRENCY = 12;

function withSlot(task) {
  return new Promise((resolve, reject) => {
    const run = async () => {
      inFlight += 1;
      try {
        resolve(await task());
      } catch (error) {
        reject(error);
      } finally {
        inFlight -= 1;
        queue.shift()?.();
      }
    };
    if (inFlight < CONCURRENCY) run();
    else queue.push(run);
  });
}

let fetched = 0;
async function fetchText(url) {
  const cacheFile = join(CACHE_DIR, createHash("sha1").update(url).digest("hex"));
  if (existsSync(cacheFile)) return readFileSync(cacheFile, "utf8");
  return withSlot(async () => {
    for (let attempt = 1; ; attempt += 1) {
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        writeFileSync(cacheFile, text);
        fetched += 1;
        if (fetched % 250 === 0) console.log(`dex-data: ${fetched} requests…`);
        return text;
      }
      if (attempt >= 3) throw new Error(`${response.status} for ${url}`);
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  });
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

/* ---------- German labels (mirrors src/lib/pokeapi.ts of the Next version) ---------- */

const ITEMS_DE = {
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

function prettify(slug) {
  return ITEMS_DE[slug] ?? slug.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("-");
}

function conditionLabel(details) {
  const detail = details[0];
  if (!detail) return undefined;
  switch (detail.trigger.name) {
    case "level-up":
      if (detail.min_level) return `Lv. ${detail.min_level}`;
      if (detail.min_happiness) return "Freundschaft";
      return "Levelaufstieg";
    case "use-item":
      return detail.item ? prettify(detail.item.name) : "Item";
    case "trade":
      return detail.held_item ? `Tausch + ${prettify(detail.held_item.name)}` : "Tausch";
    default:
      return "Spezial";
  }
}

const VARIANT_LABELS = [
  [/-mega-x$/, "Mega X"],
  [/-mega-y$/, "Mega Y"],
  [/-mega$/, "Mega"],
  [/-gmax$/, "Gigadynamax"],
  [/-alola$/, "Alola"],
  // Galarian Darmanitan is "darmanitan-galar-standard" (its Zen mode is a battle form we skip).
  [/-galar(-standard)?$/, "Galar"],
  [/-hisui$/, "Hisui"],
  [/-paldea$/, "Paldea"],
  [/-paldea-combat-breed$/, "Paldea (Gefecht)"],
  [/-paldea-blaze-breed$/, "Paldea (Flamme)"],
  [/-paldea-aqua-breed$/, "Paldea (Aqua)"],
];
const VARIANT_ORDER = [
  "Normal", "Alola", "Galar", "Hisui", "Paldea",
  "Paldea (Gefecht)", "Paldea (Flamme)", "Paldea (Aqua)",
  "Mega", "Mega X", "Mega Y", "Gigadynamax",
];

function variantLabel(pokemonName) {
  // Totem battle forms ("raticate-totem-alola") would otherwise match the regional suffixes.
  if (pokemonName.includes("totem")) return null;
  for (const [pattern, label] of VARIANT_LABELS) {
    if (pattern.test(pokemonName)) return label;
  }
  return null;
}

/* ---------- game version normalization (mirrors src/lib/generations.ts) ---------- */

const SELECTABLE_VERSIONS = new Set([
  "red", "blue", "yellow",
  "gold", "silver", "crystal",
  "ruby", "sapphire", "emerald", "firered", "leafgreen",
  "diamond", "pearl", "platinum", "heartgold", "soulsilver",
  "black", "white", "black-2", "white-2",
  "x", "y", "omega-ruby", "alpha-sapphire",
  "sun", "moon", "ultra-sun", "ultra-moon", "lets-go-pikachu", "lets-go-eevee",
  "sword", "shield", "brilliant-diamond", "shining-pearl", "legends-arceus",
  "scarlet", "violet",
]);

const VERSION_ALIASES = {
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

function normalizeVersion(slug) {
  const canonical = VERSION_ALIASES[slug] ?? slug;
  return SELECTABLE_VERSIONS.has(canonical) ? canonical : null;
}

/* ---------- data assembly ---------- */

function idFromUrl(url) {
  return Number(url.replace(/\/$/, "").split("/").pop());
}

const STAT_KEY = {
  hp: "hp",
  attack: "attack",
  defense: "defense",
  "special-attack": "spAttack",
  "special-defense": "spDefense",
  speed: "speed",
};

function toStatSet(stats) {
  const set = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
  for (const entry of stats) {
    const key = STAT_KEY[entry.stat.name];
    if (key) set[key] = entry.base_stat;
  }
  return set;
}

function germanName(entry) {
  return entry.names.find((n) => n.language.name === "de")?.name;
}

async function getGermanArea(url, fallback) {
  const area = await fetchJson(url);
  const areaName = germanName(area);
  if (areaName) return areaName;
  if (area.location) {
    const locationName = germanName(await fetchJson(area.location.url));
    if (locationName) return locationName;
  }
  return prettify(fallback);
}

const names = {};
const csv = await fetchText(SPECIES_NAMES_CSV);
for (const line of csv.split("\n")) {
  // pokemon_species_id,local_language_id,name,genus
  const [id, lang, name] = line.split(",");
  if (Number(lang) === GERMAN_LANGUAGE_ID && name) names[Number(id)] = name.replaceAll('"', "");
}
const speciesIds = Object.keys(names).map(Number).sort((a, b) => a - b);
console.log(`dex-data: ${speciesIds.length} species`);

function buildEvolutionNode(link, condition) {
  const id = idFromUrl(link.species.url);
  return {
    id,
    name: names[id] ?? link.species.name,
    ...(condition ? { condition } : {}),
    evolvesTo: link.evolves_to.map((child) =>
      buildEvolutionNode(child, conditionLabel(child.evolution_details)),
    ),
  };
}

async function buildPokemon(id) {
  const species = await fetchJson(`${API}/pokemon-species/${id}`);

  const varietyRefs = species.varieties.filter(
    (v) => v.is_default || variantLabel(v.pokemon.name) !== null,
  );
  const variants = await Promise.all(
    varietyRefs.map(async (ref) => {
      const pokemon = await fetchJson(ref.pokemon.url);
      return {
        key: ref.pokemon.name,
        label: ref.is_default ? "Normal" : variantLabel(ref.pokemon.name) ?? "Form",
        imageId: pokemon.id,
        types: pokemon.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name),
        stats: toStatSet(pokemon.stats),
      };
    }),
  );
  variants.sort((a, b) => VARIANT_ORDER.indexOf(a.label) - VARIANT_ORDER.indexOf(b.label));

  let evolution = { id, name: names[id], evolvesTo: [] };
  if (species.evolution_chain) {
    const chain = await fetchJson(species.evolution_chain.url);
    evolution = buildEvolutionNode(chain.chain);
  }

  const rawEncounters = await fetchJson(`${API}/pokemon/${id}/encounters`);
  const byVersion = {};
  for (const encounter of rawEncounters) {
    const areaName = await getGermanArea(encounter.location_area.url, encounter.location_area.name);
    for (const detail of encounter.version_details) {
      const version = normalizeVersion(detail.version.name);
      if (!version) continue;
      (byVersion[version] ??= new Set()).add(areaName);
    }
  }
  const encounters = Object.fromEntries(
    Object.entries(byVersion).map(([version, areas]) => [version, [...areas].sort()]),
  );

  return { id, name: names[id], types: variants[0].types, variants, evolution, encounters };
}

const pokemon = [];
for (let i = 0; i < speciesIds.length; i += CONCURRENCY) {
  const chunk = speciesIds.slice(i, i + CONCURRENCY);
  pokemon.push(...(await Promise.all(chunk.map(buildPokemon))));
}

mkdirSync(dirname(OUT_DATA), { recursive: true });
const dexJson = JSON.stringify({ generatedAt: new Date().toISOString(), pokemon });
writeFileSync(OUT_DATA, dexJson);

const artworkIds = pokemon.flatMap((p) => p.variants.map((v) => v.imageId));
const imageManifest = {
  sprites: speciesIds.map((id) => `${SPRITES}/${id}.png`),
  artwork: [
    ...artworkIds.map((id) => `${SPRITES}/other/official-artwork/${id}.png`),
    ...artworkIds.map((id) => `${SPRITES}/other/official-artwork/shiny/${id}.png`),
  ],
};
writeFileSync(OUT_IMAGES, JSON.stringify(imageManifest));

console.log(
  `dex-data: wrote ${(dexJson.length / 1024).toFixed(0)} KB bundle, ` +
    `${imageManifest.sprites.length} sprites, ${imageManifest.artwork.length} artwork files ` +
    `(${fetched} fresh requests)`,
);
