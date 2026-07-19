import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Marks the cell addressed by the URL hash with .is-target. CSS :target
 * doesn't update on client-side (pushState) navigation, and hashchange
 * doesn't fire either — so this derives the highlight from the router.
 */
export function HighlightFromHash() {
  const { hash } = useLocation();
  useEffect(() => {
    document
      .querySelectorAll(".dex-cell.is-target")
      .forEach((cell) => cell.classList.remove("is-target"));
    const id = hash.slice(1);
    if (id) document.getElementById(id)?.classList.add("is-target");
  }, [hash]);
  return null;
}
