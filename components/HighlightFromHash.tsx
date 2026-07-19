"use client";

import { useEffect } from "react";

/**
 * Marks the cell addressed by the URL hash with .is-target.
 * Needed because browsers don't update CSS :target on client-side
 * (pushState) navigation, only on full page loads.
 */
export function HighlightFromHash() {
  useEffect(() => {
    const apply = () => {
      document
        .querySelectorAll(".dex-cell.is-target")
        .forEach((cell) => cell.classList.remove("is-target"));
      const id = window.location.hash.slice(1);
      if (id) document.getElementById(id)?.classList.add("is-target");
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);
  return null;
}
