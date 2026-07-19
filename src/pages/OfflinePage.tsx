import { OfflineManager } from "@/components/OfflineManager";
import { usePageTitle } from "@/lib/title";

export function OfflinePage() {
  usePageTitle("Offline & Downloads – Better Dex");
  return (
    <main className="content-page">
      <div className="page-head">
        <h1>Offline &amp; Downloads</h1>
        <p>
          Better Dex funktioniert auch ohne Internet. Tipp: Füge die Seite über{" "}
          <b>Teilen → Zum Home-Bildschirm</b> hinzu, dann fühlt sie sich wie eine richtige App an.
        </p>
      </div>
      <OfflineManager />
    </main>
  );
}
