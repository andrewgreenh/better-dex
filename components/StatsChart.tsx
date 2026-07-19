import type { StatSet } from "@/lib/pokeapi";

/** Axes clockwise from the top, matching the in-game stat hexagon. */
const AXES: { key: keyof StatSet; label: string }[] = [
  { key: "hp", label: "KP" },
  { key: "attack", label: "Angriff" },
  { key: "defense", label: "Vert." },
  { key: "speed", label: "Init." },
  { key: "spDefense", label: "Sp.-Vert." },
  { key: "spAttack", label: "Sp.-Angr." },
];

const CENTER = 120;
const RADIUS = 72;
const RINGS = [0.25, 0.5, 0.75, 1];

// Round coordinates so the server and client produce byte-identical SVG —
// raw Math.sin/cos differ in the last float digit and break hydration.
const round = (n: number) => Math.round(n * 100) / 100;

function point(index: number, ratio: number): [number, number] {
  const angle = (Math.PI * 2 * index) / AXES.length; // 0 = top, clockwise
  const r = RADIUS * ratio;
  return [round(CENTER + r * Math.sin(angle)), round(CENTER - r * Math.cos(angle))];
}

function polygon(ratios: number[]): string {
  return ratios.map((ratio, i) => point(i, ratio).join(",")).join(" ");
}

/** Base stats as a Spinnennetzdiagramm (radar chart) — pure SVG, no dependencies. */
export function StatsChart({ stats }: { stats: StatSet }) {
  const values = AXES.map((axis) => stats[axis.key]);
  const max = Math.max(200, ...values);
  const total = values.reduce((sum, value) => sum + value, 0);

  return (
    <section className="panel" aria-label="Basiswerte">
      <h2>Basiswerte</h2>
      <div className="stats-chart">
        <svg viewBox="0 0 240 240" role="img" aria-label={`Basiswerte, Gesamt ${total}`}>
          {RINGS.map((ring) => (
            <polygon key={ring} className="stats-grid" points={polygon(AXES.map(() => ring))} />
          ))}
          {AXES.map((axis, i) => {
            const [x, y] = point(i, 1);
            return <line key={axis.key} className="stats-axis" x1={CENTER} y1={CENTER} x2={x} y2={y} />;
          })}
          <polygon className="stats-area" points={polygon(values.map((value) => value / max))} />
          {values.map((value, i) => {
            const [x, y] = point(i, value / max);
            return <circle key={AXES[i].key} className="stats-dot" cx={x} cy={y} r={3.5} />;
          })}
          {AXES.map((axis, i) => {
            const [x, y] = point(i, 1.2);
            return (
              <text key={axis.key} className="stats-label" x={x} y={y} textAnchor="middle">
                <tspan x={x} dy="-0.25em">
                  {axis.label}
                </tspan>
                <tspan x={x} dy="1.2em" className="stats-value">
                  {stats[axis.key]}
                </tspan>
              </text>
            );
          })}
        </svg>
      </div>
      <p className="stats-total">
        Gesamt <strong>{total}</strong>
      </p>
    </section>
  );
}
