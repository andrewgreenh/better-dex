import { Link, useLocation } from "react-router-dom";
import { GridIcon } from "./icons";

/**
 * Header link to the full list. When we're on a Pokémon page, it links to
 * that Pokémon's anchor so the list opens highlighted and scrolled into view.
 */
export function ListLink() {
  const { pathname } = useLocation();
  const match = /^\/pokemon\/(\d+)$/.exec(pathname);
  const to = match ? `/pokedex#p-${match[1]}` : "/pokedex";
  return (
    <Link to={to} className="nav-pill">
      <GridIcon />
      <span>Liste</span>
    </Link>
  );
}
