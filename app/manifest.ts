import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Better Dex",
    short_name: "Better Dex",
    description:
      "Ein Pokédex zum Entdecken: Typen, Stärken, Schwächen und Entwicklungen aller Pokémon.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fdeee4",
    theme_color: "#fdeee4",
    lang: "de",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
