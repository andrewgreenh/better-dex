import Image from "next/image";
import Link from "next/link";
import type { NavTarget } from "@/lib/pokeapi";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export function DexNav({ prev, next }: { prev: NavTarget; next: NavTarget }) {
  return (
    <nav className="dex-nav" aria-label="Pokédex-Navigation">
      <Link className="nav-btn prev" href={`/pokemon/${prev.id}`}>
        <span className="chev">
          <ChevronLeftIcon />
        </span>
        <span className="preview">
          <Image src={prev.sprite} alt="" width={48} height={48} />
        </span>
        <span className="txt">
          <small>Zurück</small>
          <b>{prev.name}</b>
        </span>
      </Link>
      <Link className="nav-btn next" href={`/pokemon/${next.id}`}>
        <span className="chev">
          <ChevronRightIcon />
        </span>
        <span className="preview">
          <Image src={next.sprite} alt="" width={48} height={48} />
        </span>
        <span className="txt">
          <small>Weiter</small>
          <b>{next.name}</b>
        </span>
      </Link>
    </nav>
  );
}
