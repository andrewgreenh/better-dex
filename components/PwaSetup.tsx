"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (production only) and asks it to fill the
 * offline cache (all pages + sprites) in the background.
 */
export function PwaSetup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        registration.active?.postMessage({ type: "fill" });
      })
      .catch(() => {
        // Offline support is progressive enhancement; ignore failures.
      });
  }, []);

  return null;
}
