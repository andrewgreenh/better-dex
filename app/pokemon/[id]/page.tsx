import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DexNav } from "@/components/DexNav";
import { EvolutionChain } from "@/components/EvolutionChain";
import { PokemonView } from "@/components/PokemonView";
import { getAllSpeciesIds, getGermanNames, getPokemonPage } from "@/lib/pokeapi";

export async function generateStaticParams() {
  const ids = await getAllSpeciesIds();
  return ids.map((id) => ({ id: String(id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const names = await getGermanNames();
  const name = names[Number(id)];
  return {
    title: name ? `${name} – Better Dex` : "Better Dex",
  };
}

export default async function PokemonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  const names = await getGermanNames();
  if (!Number.isInteger(id) || !names[id]) notFound();

  const page = await getPokemonPage(id);

  return (
    <main>
      <DexNav prev={page.prev} next={page.next} />
      <PokemonView
        name={page.name}
        dexNo={`#${String(page.id).padStart(4, "0")}`}
        variants={page.variants}
        evolution={<EvolutionChain root={page.evolution} currentId={page.id} />}
      />
    </main>
  );
}
