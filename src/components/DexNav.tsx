import { Link } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export interface NavTarget {
  id: number;
  name: string;
  sprite: string;
}

export function DexNav({ prev, next }: { prev: NavTarget; next: NavTarget }) {
  return (
    <nav className="dex-nav" aria-label="Pokédex-Navigation">
      <Link className="nav-btn prev" to={`/pokemon/${prev.id}`}>
        <span className="chev">
          <ChevronLeftIcon />
        </span>
        <span className="preview">
          <img src={prev.sprite} alt="" width={48} height={48} />
        </span>
        <span className="txt">
          <small>Zurück</small>
          <b>{prev.name}</b>
        </span>
      </Link>
      <Link className="nav-btn next" to={`/pokemon/${next.id}`}>
        <span className="chev">
          <ChevronRightIcon />
        </span>
        <span className="preview">
          <img src={next.sprite} alt="" width={48} height={48} />
        </span>
        <span className="txt">
          <small>Weiter</small>
          <b>{next.name}</b>
        </span>
      </Link>
    </nav>
  );
}
