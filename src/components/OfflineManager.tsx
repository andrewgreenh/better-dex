import { useCallback, useEffect, useState } from "react";

interface Bucket {
  total: number;
  cached: number;
}

interface Status {
  app: Bucket;
  sprites: Bucket;
  artwork: Bucket;
}

interface Progress {
  done: number;
  total: number;
  failed: number;
}

function Row({ label, bucket }: { label: string; bucket: Bucket }) {
  const complete = bucket.cached >= bucket.total;
  return (
    <div className="offline-row">
      <span className="offline-label">{label}</span>
      <span className="offline-bar">
        <span
          className="offline-bar-fill"
          style={{ width: `${bucket.total ? (bucket.cached / bucket.total) * 100 : 0}%` }}
        />
      </span>
      <span className={`offline-count${complete ? " complete" : ""}`}>
        {bucket.cached} / {bucket.total}
      </span>
    </div>
  );
}

export function OfflineManager() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  const requestStatus = useCallback(() => {
    navigator.serviceWorker?.controller?.postMessage({ type: "status" });
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const onMessage = (event: MessageEvent) => {
      const data = event.data || {};
      if (data.type === "status") {
        setStatus({ app: data.app, sprites: data.sprites, artwork: data.artwork });
      }
      if (data.type === "fill-progress") {
        setProgress({ done: data.done, total: data.total, failed: data.failed });
      }
      if (data.type === "fill-done" || data.type === "reset-done") {
        setProgress(null);
        navigator.serviceWorker?.controller?.postMessage({ type: "status" });
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    // The controller may not exist yet on the very first visit.
    const interval = setInterval(() => {
      if (navigator.serviceWorker.controller) {
        requestStatus();
        clearInterval(interval);
      }
    }, 500);
    requestStatus();

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
      clearInterval(interval);
    };
  }, [requestStatus]);

  const downloadAll = () => {
    setProgress({ done: 0, total: 1, failed: 0 });
    navigator.serviceWorker?.controller?.postMessage({ type: "fill-artwork" });
  };

  const resetCache = () => {
    if (!window.confirm("Wirklich alle gespeicherten Seiten und Bilder löschen?")) return;
    navigator.serviceWorker?.controller?.postMessage({ type: "reset" });
  };

  if (supported === false) {
    return (
      <p className="offline-note">
        Dein Browser unterstützt keine Offline-Funktion (Service Worker).
      </p>
    );
  }

  if (!status) {
    return (
      <p className="offline-note">
        Offline-Speicher wird vorbereitet … Beim allerersten Besuch kann das einen Moment dauern —
        lade die Seite danach einmal neu.
      </p>
    );
  }

  return (
    <div className="offline-panel">
      <Row label="App & Daten" bucket={status.app} />
      <Row label="Pixel-Bilder" bucket={status.sprites} />
      <Row label="Artwork" bucket={status.artwork} />

      {progress ? (
        <div className="offline-progress">
          <span className="offline-bar big">
            <span
              className="offline-bar-fill"
              style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
            />
          </span>
          <span className="offline-count">
            {progress.done} / {progress.total}
            {progress.failed > 0 ? ` · ${progress.failed} Fehler` : ""}
          </span>
        </div>
      ) : (
        <div className="offline-actions">
          <button type="button" className="offline-download" onClick={downloadAll}>
            Alle Bilder herunterladen (ca. 500 MB)
          </button>
          <button type="button" className="offline-reset" onClick={resetCache}>
            Cache zurücksetzen
          </button>
        </div>
      )}

      <p className="offline-note">
        Die App, alle Daten und die Pixel-Bilder werden automatisch gespeichert. Lade zusätzlich
        das große Artwork herunter (am besten im WLAN), dann funktioniert der ganze Pokédex ohne
        Internet — auch im Flugzeug oder im Wald.
      </p>
    </div>
  );
}
