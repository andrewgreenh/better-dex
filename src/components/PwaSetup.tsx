import { useEffect } from "react";

/**
 * Registers the service worker (production only) and asks it to fill the
 * offline image cache (pixel sprites) in the background.
 */
export function PwaSetup() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
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
