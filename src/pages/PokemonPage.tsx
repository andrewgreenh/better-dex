import { Link, useParams } from "react-router-dom";
import { DexNav } from "@/components/DexNav";
import { EvolutionChain } from "@/components/EvolutionChain";
import { PokemonView, type Variant } from "@/components/PokemonView";
import { artworkUrl, formatDexNo, shinyArtworkUrl, spriteUrl, useDex } from "@/lib/dex";
import { usePageTitle } from "@/lib/title";
import { computeEffectiveness } from "@/lib/types";

export function PokemonPage() {
  const { id: rawId } = useParams();
  const { byId, maxId } = useDex();
  const id = Number(rawId);
  const entry = byId.get(id);
  usePageTitle(entry ? `${entry.name} – Better Dex` : "Better Dex");

  if (!entry) {
    return (
      <main className="content-page">
        <div className="page-head">
          <h1>Nicht gefunden</h1>
          <p>
            Dieses Pokémon kennen wir nicht. <Link to="/">Zurück zur Liste</Link>
          </p>
        </div>
      </main>
    );
  }

  const prev = byId.get(id === 1 ? maxId : id - 1)!;
  const next = byId.get(id === maxId ? 1 : id + 1)!;
  const variants: Variant[] = entry.variants.map((variant) => ({
    key: variant.key,
    label: variant.label,
    image: artworkUrl(variant.imageId),
    shinyImage: shinyArtworkUrl(variant.imageId),
    types: variant.types,
    effectiveness: computeEffectiveness(variant.types),
    stats: variant.stats,
  }));

  return (
    <main>
      <DexNav
        prev={{ id: prev.id, name: prev.name, sprite: spriteUrl(prev.id) }}
        next={{ id: next.id, name: next.name, sprite: spriteUrl(next.id) }}
      />
      {/* Keyed by id so variant selection and shiny toggle reset per Pokémon. */}
      <PokemonView
        key={id}
        name={entry.name}
        dexNo={formatDexNo(id)}
        variants={variants}
        encounters={entry.encounters}
        evolution={<EvolutionChain root={entry.evolution} currentId={id} />}
      />
    </main>
  );
}
