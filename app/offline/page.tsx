import type { Metadata } from "next";
import { OfflineManager } from "@/components/OfflineManager";

export const metadata: Metadata = {
  title: "Offline & Downloads – Better Dex",
};

export default function OfflinePage() {
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
      <p className="offline-note" style={{ marginTop: 14 }}>
        Falls du hier gelandet bist, weil eine Seite offline noch nicht gespeichert war: Gehe
        zurück, sobald du wieder Internet hast — sie wird dann automatisch gespeichert.
      </p>
    </main>
  );
}
