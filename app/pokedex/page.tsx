import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HighlightFromHash } from "@/components/HighlightFromHash";
import { TypeFilterBar } from "@/components/TypeFilterBar";
import { getGermanNames, getTypesMap, spriteUrl } from "@/lib/pokeapi";

export const metadata: Metadata = {
  title: "Alle Pokémon – Better Dex",
};

export default async function PokedexPage() {
  const [names, typesMap] = await Promise.all([getGermanNames(), getTypesMap()]);
  const entries = Object.entries(names)
    .map(([id, name]) => ({ id: Number(id), name, types: typesMap[Number(id)] ?? [] }))
    .sort((a, b) => a.id - b.id);

  return (
    <main className="content-page">
      <HighlightFromHash />
      <div className="page-head">
        <h1>Alle Pokémon</h1>
      </div>
      <TypeFilterBar />
      <div className="dex-grid">
        {entries.map((entry) => (
          <Link
            key={entry.id}
            id={`p-${entry.id}`}
            className="dex-cell"
            href={`/pokemon/${entry.id}`}
            data-types={entry.types.join(" ")}
          >
            <Image src={spriteUrl(entry.id)} alt="" width={56} height={56} />
            <b>{entry.name}</b>
            <span>#{String(entry.id).padStart(4, "0")}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
