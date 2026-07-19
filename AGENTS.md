# Better Dex

A fully static, offline-first PWA: Vite + plain React + react-router. All
Pokédex data is generated at build time into one JSON bundle
(`scripts/generate-data.mjs` → `src/generated/dex.json`) and loaded once at
startup — the client never talks to PokeAPI. There is no server rendering.

- `npm run dev` — dev server (generates the data bundle on first run)
- `npm run build` — data + typecheck + bundle + service worker (`dist/`)
- `npm run data` — force-refresh the data bundle from PokeAPI
