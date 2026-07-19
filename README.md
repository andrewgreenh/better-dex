# Better Dex

Ein kinderfreundlicher Pokédex zum Entdecken — optimiert für iPad und Smartphone.

**Features**

- Alle 1025 Pokémon mit deutschen Namen, offiziellem Artwork und Varianten (Mega / Gigadynamax)
- Typen mit Farbe **und** Icon, damit auch Nicht-Leser sie erkennen
- Stärken/Schwächen aller Angriffs-Typen (4× / 2× / ½× / ¼× / 0×), live pro Variante berechnet
- Entwicklungsketten inkl. Verzweigungen (Evoli!) mit deutschen Bedingungen
- Blättern wie im Bilderbuch: Zurück/Weiter mit Vorschaubild
- Clientseitige Suche über die deutschen Namen
- Vorlesen von Namen und Typen (Web Speech API, deutsch)
- Offline-fähige PWA: App, Daten + Pixel-Bilder werden automatisch gespeichert, das große
  Artwork optional per Download-Button („Offline &amp; Downloads")

**Tech**

- Vite + React (SPA), vollständig statisch gebaut
- Alle Daten von [PokeAPI](https://pokeapi.co) zur Build-Zeit in ein JSON-Bundle generiert
- Deutsche Namen aus der PokeAPI-CSV (`pokemon_species_names.csv`, Sprache 6); alle anderen Sprachen werden verworfen
- Typen-Effektivität als statische Spielkonstante im Code (keine API-Calls)

## Entwicklung

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # statischer Build aller Seiten
```

## Design

Das Design-System liegt unter [`design/`](design/) (Claude-Design-Projekt „Better Pokédex“):
`design/src` enthält Tokens, Icons und Komponenten-Previews, `node design/build.mjs` baut
eigenständige HTML-Previews nach `design/dist`.
