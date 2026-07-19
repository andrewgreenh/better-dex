import { Link } from "react-router-dom";
import { artworkUrl, type EvolutionNode } from "@/lib/dex";
import { ArrowRightIcon } from "./icons";

function Stage({ node, currentId }: { node: EvolutionNode; currentId: number }) {
  const isCurrent = node.id === currentId;
  const stage = (
    <>
      <span className="evo-img">
        <img src={artworkUrl(node.id)} alt="" width={68} height={68} loading="lazy" decoding="async" />
      </span>
      <b>{node.name}</b>
    </>
  );
  if (isCurrent) {
    return <span className="evo-stage current">{stage}</span>;
  }
  return (
    <Link className="evo-stage" to={`/pokemon/${node.id}`}>
      {stage}
    </Link>
  );
}

function Arrow({ condition }: { condition?: string }) {
  return (
    <span className="evo-arrow">
      <ArrowRightIcon />
      {condition ? <span>{condition}</span> : null}
    </span>
  );
}

function Chain({ node, currentId }: { node: EvolutionNode; currentId: number }) {
  return (
    <div className="evo-row">
      <Stage node={node} currentId={currentId} />
      {node.evolvesTo.length === 1 && (
        <>
          <Arrow condition={node.evolvesTo[0].condition} />
          <Chain node={node.evolvesTo[0]} currentId={currentId} />
        </>
      )}
      {node.evolvesTo.length > 1 && (
        <div className="evo-branches">
          {node.evolvesTo.map((child) => (
            <div className="evo-branch-row" key={child.id}>
              <Arrow condition={child.condition} />
              <Chain node={child} currentId={currentId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EvolutionChain({ root, currentId }: { root: EvolutionNode; currentId: number }) {
  return (
    <section className="panel" aria-label="Entwicklung">
      <h2>Entwicklung</h2>
      {root.evolvesTo.length === 0 ? (
        <p style={{ fontWeight: 700, color: "var(--ink-soft)", fontSize: 14 }}>
          Dieses Pokémon entwickelt sich nicht.
        </p>
      ) : (
        <div className="evo-scroll">
          <Chain node={root} currentId={currentId} />
        </div>
      )}
    </section>
  );
}
