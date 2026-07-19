"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import type { Variant } from "@/lib/pokeapi";
import { EffectivenessPanel } from "./EffectivenessPanel";
import { SpeakButton } from "./SpeakButton";
import { TypeBadge } from "./TypeBadge";

interface Props {
  name: string;
  dexNo: string;
  variants: Variant[];
  /** Server-rendered evolution chain, independent of the selected variant. */
  evolution: ReactNode;
}

/**
 * Hero + effectiveness with client-side variant switching:
 * Mega/Gigadynamax forms swap artwork, typing, and effectiveness live.
 */
export function PokemonView({ name, dexNo, variants, evolution }: Props) {
  const [activeKey, setActiveKey] = useState(variants[0].key);
  const active = variants.find((variant) => variant.key === activeKey) ?? variants[0];
  const displayName = active.label === "Normal" ? name : `${active.label}-${name}`;

  return (
    <div className="dex-page">
      <div className="hero">
        <div className="hero-top">
          <span className="hero-name">
            <h1>{displayName}</h1>
            <SpeakButton text={displayName} />
          </span>
          <span className="dexno">{dexNo}</span>
        </div>
        <div className="hero-types">
          {active.types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </div>
        <div className="hero-art">
          <Image src={active.image} alt={displayName} width={280} height={280} priority />
        </div>
        {variants.length > 1 && (
          <div className="variants">
            {variants.map((variant) => (
              <button
                key={variant.key}
                type="button"
                className={`variant-chip${variant.key === active.key ? " active" : ""}`}
                onClick={() => setActiveKey(variant.key)}
              >
                <span className="thumb">
                  <Image src={variant.image} alt="" width={54} height={54} />
                </span>
                <span>{variant.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="side-col">
        <EffectivenessPanel name={displayName} buckets={active.effectiveness} />
        {evolution}
      </div>
    </div>
  );
}
