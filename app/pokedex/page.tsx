import type { Metadata } from "next";
import { PokedexList } from "@/components/PokedexList";

export const metadata: Metadata = {
  title: "Alle Pokémon – Better Dex",
};

export default function PokedexPage() {
  return <PokedexList />;
}
