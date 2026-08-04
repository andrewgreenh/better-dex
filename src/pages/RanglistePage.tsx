import { StatRanking } from "@/components/StatRanking";
import { usePageTitle } from "@/lib/title";

export function RanglistePage() {
  usePageTitle("Rangliste – Better Dex");
  return (
    <main className="content-page">
      <div className="page-head">
        <h1>Rangliste</h1>
        <p>
          Wähle einen Wert – dann stehen alle Pokémon von stark nach schwach.
          <b> Gesamt (relevant)</b> lässt den schwächeren der beiden
          Angriffswerte weg.
        </p>
      </div>
      <StatRanking />
    </main>
  );
}
