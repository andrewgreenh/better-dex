"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GridIcon } from "./icons";

/**
 * Header link to the full list. When we're on a Pokémon page, it links to
 * that Pokémon's anchor so the list opens highlighted and scrolled into view.
 */
export function ListLink() {
  const pathname = usePathname();
  const match = /^\/pokemon\/(\d+)$/.exec(pathname);
  const href = match ? `/pokedex#p-${match[1]}` : "/pokedex";
  return (
    <Link href={href} className="nav-pill">
      <GridIcon />
      <span>Liste</span>
    </Link>
  );
}
