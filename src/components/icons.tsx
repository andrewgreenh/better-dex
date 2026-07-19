import type { TypeName } from "@/lib/types";

/** Inline SVG glyphs from the design system (24×24, currentColor). */
const TYPE_PATHS: Record<TypeName, React.ReactNode> = {
  normal: <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="4" />,
  fire: (
    <>
      <path d="M12 2c1 4-4 5.5-4 10a4 4 0 0 0 1.5 3.2C9 12.6 11 11.5 12 9c1 2.5 3 3.6 2.5 6.2A4 4 0 0 0 16 12c0-2.5-1.2-4-2-5.5C13.4 5 12.7 3.4 12 2z" />
      <path d="M12 22a6 6 0 0 0 6-6c0-1.6-.6-2.9-1.4-4.2C16 14.6 13.6 15.6 13 18c-1.6-1.2-2.4-3-1.8-5.2C8.6 14.4 7.4 16 7.4 17.6A6 6 0 0 0 12 22z" />
    </>
  ),
  water: (
    <>
      <path d="M12 2.5S5.5 10 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 10 12 2.5 12 2.5z" />
      <circle cx="9.6" cy="14.8" r="1.6" fill="#fff" opacity=".55" />
    </>
  ),
  electric: <path d="M13.5 2 4.5 13.5h5L9 22l9.5-11.5h-5.2L13.5 2z" />,
  grass: (
    <>
      <path d="M20.5 3.5C10 3.5 4 9.5 4 20c10.5 0 16.5-6 16.5-16.5z" />
      <path d="M6.5 17.5C9 12 13 8 18 6" fill="none" stroke="currentColor" strokeWidth="1.6" opacity=".5" />
    </>
  ),
  ice: (
    <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17" />
    </g>
  ),
  fighting: (
    <path d="M5 12v4.5A4.5 4.5 0 0 0 9.5 21h5a4.5 4.5 0 0 0 4.5-4.5V9a1.8 1.8 0 0 0-3.6 0V8a1.8 1.8 0 0 0-3.6 0V7.4a1.8 1.8 0 0 0-3.6 0V8.6A1.8 1.8 0 0 0 5 8.8V12z" />
  ),
  poison: (
    <>
      <circle cx="9" cy="9" r="5.5" />
      <circle cx="16.5" cy="14" r="3.8" opacity=".8" />
      <circle cx="9.5" cy="18.5" r="2.4" opacity=".65" />
    </>
  ),
  ground: <path d="M2 20 9 7l4.2 7L16 9.5 22 20H2z" />,
  flying: (
    <path d="M21.5 4.5C13 6.5 7.5 9 3 17.5c5.5 1.5 10.5.5 13.5-2.5-2 .5-3.5.5-5 0 3.5-.5 6-2 7.5-4.5-1.8.6-3.2.8-4.8.5 3.6-1.2 5.8-3.4 7.3-6.5z" />
  ),
  psychic: (
    <>
      <path fillRule="evenodd" d="M2 12c3.5-6.5 16.5-6.5 20 0-3.5 6.5-16.5 6.5-20 0zm10 3.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2z" />
      <circle cx="12" cy="12" r="1.8" />
    </>
  ),
  bug: (
    <>
      <ellipse cx="12" cy="14.5" rx="5.5" ry="7" />
      <circle cx="12" cy="5.5" r="3" />
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M10 3.5 7.5 1M14 3.5 16.5 1M6.5 12H3M6.5 17l-2.5 2M17.5 12H21M17.5 17l2.5 2" />
      </g>
    </>
  ),
  rock: (
    <>
      <path d="M7.5 3.5h9L21 12l-4 8.5H7L3 12l4.5-8.5z" />
      <path d="m12 4 1.5 7.5L9 20M13.5 11.5 20 12" fill="none" stroke="#fff" strokeWidth="1.3" opacity=".4" />
    </>
  ),
  ghost: (
    <path
      fillRule="evenodd"
      d="M12 2.5A7.5 7.5 0 0 0 4.5 10v11l3-2.2 2.2 2.2 2.3-2.2 2.3 2.2 2.2-2.2 3 2.2V10A7.5 7.5 0 0 0 12 2.5zM9.3 10.6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5.4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
    />
  ),
  dragon: (
    <path d="M4 3c6 0 9.5 2 11.5 5.5L21 7l-2.5 4.5c1 2.5.5 5.5-1.5 8.5-.5-2-1.5-3.2-3-4 .5 2-.2 3.8-2 5.5-.3-2.2-1.2-3.6-3-4.5C6 15.5 4.5 12.5 4.5 9 6.7 9.6 8.4 9.5 10 8.5 7.8 7.5 6 5.8 4 3z" />
  ),
  dark: <path d="M20.5 14.5A9 9 0 1 1 9.5 3.4a7.5 7.5 0 0 0 11 11.1z" />,
  steel: (
    <path
      fillRule="evenodd"
      d="M12 1.5 21.1 6.75v10.5L12 22.5l-9.1-5.25V6.75L12 1.5zm0 14.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
    />
  ),
  fairy: (
    <>
      <path d="M12 1.5l1.8 8.7 8.7 1.8-8.7 1.8-1.8 8.7-1.8-8.7-8.7-1.8 8.7-1.8L12 1.5z" />
      <circle cx="19" cy="5" r="1.5" opacity=".7" />
    </>
  ),
};

export function TypeIcon({ type }: { type: TypeName }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {TYPE_PATHS[type]}
    </svg>
  );
}

export function PokeballIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 1.5A10.5 10.5 0 0 1 22.4 10.5h-6.6a4 4 0 0 0-7.6 0H1.6A10.5 10.5 0 0 1 12 1.5zM1.6 13.5h6.6a4 4 0 0 0 7.6 0h6.6A10.5 10.5 0 0 1 1.6 13.5zM12 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
      />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" strokeWidth="3" />
      <path d="m15.5 15.5 5 5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M15 4 7 12l8 8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="m9 4 8 8-8 8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 9v6h3.5L13 19.5v-15L7.5 9H4z" />
      <path
        d="M16 8.5c1 .9 1.6 2.1 1.6 3.5S17 14.6 16 15.5M18.5 6c1.7 1.5 2.7 3.6 2.7 6s-1 4.5-2.7 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M12 3v11m0 0-5-5m5 5 5-5" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

export function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="2.5" />
      <rect x="13" y="3" width="8" height="8" rx="2.5" />
      <rect x="3" y="13" width="8" height="8" rx="2.5" />
      <rect x="13" y="13" width="8" height="8" rx="2.5" />
    </svg>
  );
}

export function MatrixIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="2.6" />
      <path d="M9.5 3v18M3 9.5h18" strokeWidth="2.6" />
    </svg>
  );
}

export function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path d="M5 12h14m0 0-6-6m6 6-6 6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
