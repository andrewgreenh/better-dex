"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import type { EncounterMap, Variant } from "@/lib/pokeapi";
import { EffectivenessPanel } from "./EffectivenessPanel";
import { EncounterPanel } from "./EncounterPanel";
import { SpeakButton } from "./SpeakButton";
import { StatsChart } from "./StatsChart";
import { TypeBadge } from "./TypeBadge";

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 2.5l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.9L12 2.5z" />
      <path d="M18.5 14l.95 2.3 2.3.95-2.3.95-.95 2.3-.95-2.3-2.3-.95 2.3-.95.95-2.3z" />
      <path d="M5.5 14.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9z" />
    </svg>
  );
}

interface Props {
  name: string;
  dexNo: string;
  variants: Variant[];
  /** Catch locations per game version, independent of the selected variant. */
  encounters: EncounterMap;
  /** Server-rendered evolution chain, independent of the selected variant. */
  evolution: ReactNode;
}

/**
 * Hero + effectiveness with client-side variant switching:
 * Mega/Gigadynamax forms swap artwork, typing, and effectiveness live.
 */
export function PokemonView({ name, dexNo, variants, encounters, evolution }: Props) {
  const [activeKey, setActiveKey] = useState(variants[0].key);
  const [shiny, setShiny] = useState(false);
  const active = variants.find((variant) => variant.key === activeKey) ?? variants[0];
  const displayName = active.label === "Normal" ? name : `${active.label}-${name}`;
  const heroImage = shiny ? active.shinyImage : active.image;

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
          <button
            type="button"
            className={`shiny-toggle${shiny ? " active" : ""}`}
            aria-pressed={shiny}
            title={shiny ? "Normale Farbe zeigen" : "Schillernde Farbe zeigen"}
            aria-label={shiny ? "Normale Farbe zeigen" : "Schillernde Farbe zeigen"}
            onClick={() => setShiny((on) => !on)}
          >
            <SparklesIcon />
          </button>
          <Image
            key={heroImage}
            src={heroImage}
            alt={shiny ? `${displayName} (schillernd)` : displayName}
            width={280}
            height={280}
            priority
          />
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
                  <Image
                    key={shiny ? "shiny" : "normal"}
                    src={shiny ? variant.shinyImage : variant.image}
                    alt=""
                    width={54}
                    height={54}
                  />
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
        <StatsChart stats={active.stats} />
        <EncounterPanel encounters={encounters} />
      </div>
    </div>
  );
}
