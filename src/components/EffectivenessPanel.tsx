import type { EffectivenessBucket } from "@/lib/types";
import { TypeBadge } from "./TypeBadge";

const MULT_STYLE: Record<EffectivenessBucket["multiplier"], { text: string; color: string }> = {
  "4": { text: "4×", color: "var(--eff-4x)" },
  "2": { text: "2×", color: "var(--eff-2x)" },
  "1/2": { text: "½×", color: "var(--eff-half)" },
  "1/4": { text: "¼×", color: "var(--eff-quart)" },
  "0": { text: "0×", color: "var(--eff-zero)" },
};

export function EffectivenessPanel({ name, buckets }: { name: string; buckets: EffectivenessBucket[] }) {
  return (
    <section className="panel" aria-label={`Attacken gegen ${name}`}>
      <h2>Attacken gegen {name}</h2>
      {buckets.map((bucket) => (
        <div className="effrow" key={bucket.multiplier}>
          <div className="effmult" style={{ background: MULT_STYLE[bucket.multiplier].color }}>
            {MULT_STYLE[bucket.multiplier].text}
          </div>
          <div className="efflabel">{bucket.label}</div>
          <div className="efftypes">
            {bucket.types.map((type) => (
              <TypeBadge key={type} type={type} small />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
