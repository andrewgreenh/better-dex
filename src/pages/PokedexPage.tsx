import { PokedexList } from "@/components/PokedexList";
import { usePageTitle } from "@/lib/title";

/** The full list — served at both / and /pokedex (iOS PWAs need a redirect-free start_url). */
export function PokedexPage() {
  usePageTitle("Alle Pokémon – Better Dex");
  return <PokedexList />;
}
