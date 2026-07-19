import type { Metadata } from "next";
import { TypeIcon } from "@/components/icons";
import { TYPE_CHART, TYPE_NAMES_DE, TYPE_ORDER, type TypeName } from "@/lib/types";

export const metadata: Metadata = {
  title: "Typen-Tabelle – Better Dex",
};

function Cell({ attacker, defender }: { attacker: TypeName; defender: TypeName }) {
  const multiplier = TYPE_CHART[attacker][defender] ?? 1;
  if (multiplier === 2) return <td className="m-2">2</td>;
  if (multiplier === 0.5) return <td className="m-05">½</td>;
  if (multiplier === 0) return <td className="m-0">0</td>;
  return <td className="m-1" />;
}

export default function TypenPage() {
  return (
    <main className="content-page">
      <div className="page-head">
        <h1>Typen-Tabelle</h1>
        <p>
          Zeilen greifen an, Spalten verteidigen: Wie stark trifft eine{" "}
          <b>Feuer</b>-Attacke ein <b>Pflanzen</b>-Pokémon? 2×!
        </p>
        <div className="matrix-legend">
          <span><i className="m-2">2</i> doppelt so stark</span>
          <span><i className="m-05">½</i> nur halb so stark</span>
          <span><i className="m-0">0</i> wirkt gar nicht</span>
        </div>
      </div>
      <div className="matrix-card">
        <div className="matrix-scroll">
          <table className="matrix">
            <thead>
              <tr>
                <th className="corner">
                  <span>Angriff ↓</span>
                  <span>Abwehr →</span>
                </th>
                {TYPE_ORDER.map((type) => (
                  <th key={type} scope="col">
                    <span className={`mchip t-${type}`} title={TYPE_NAMES_DE[type]}>
                      <TypeIcon type={type} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TYPE_ORDER.map((attacker) => (
                <tr key={attacker}>
                  <th scope="row">
                    <span className={`mchip t-${attacker}`}>
                      <TypeIcon type={attacker} />
                    </span>
                    <span className="mname">{TYPE_NAMES_DE[attacker]}</span>
                  </th>
                  {TYPE_ORDER.map((defender) => (
                    <Cell key={defender} attacker={attacker} defender={defender} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
