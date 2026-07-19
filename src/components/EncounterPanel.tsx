import { useSyncExternalStore } from "react";
import type { EncounterMap } from "@/lib/dex";
import { DEFAULT_VERSION, GENERATIONS, hasEncounterData, versionLabel } from "@/lib/generations";

const STORAGE_KEY = "betterdex:version";

// The selected game lives in localStorage so it carries across every Pokémon
// page. A tiny store lets all panels re-read it on change (this tab and others)
// without a hydration mismatch — the server snapshot is always the default.
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_VERSION;
}

function getServerSnapshot() {
  return DEFAULT_VERSION;
}

function selectVersion(next: string) {
  localStorage.setItem(STORAGE_KEY, next);
  for (const listener of listeners) listener();
}

/** Catch locations for the game selected via the shared, persisted picker. */
export function EncounterPanel({ encounters }: { encounters: EncounterMap }) {
  const version = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const areas = encounters[version] ?? [];
  const availableIn = Object.keys(encounters);
  // For games our data source doesn't cover, an empty list means "unknown",
  // not "not catchable" — say so honestly instead of claiming it's uncatchable.
  const noData = areas.length === 0 && !hasEncounterData(version);

  return (
    <section className="panel" aria-label="Fundorte">
      <div className="enc-head">
        <h2>Fundorte</h2>
        <select
          className="enc-select"
          aria-label="Spiel auswählen"
          value={version}
          onChange={(event) => selectVersion(event.target.value)}
        >
          {GENERATIONS.map((gen) => (
            <optgroup key={gen.id} label={gen.label}>
              {gen.versions.map((game) => (
                <option key={game.slug} value={game.slug}>
                  {game.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {areas.length > 0 ? (
        <ul className="enc-list">
          {areas.map((area) => (
            <li key={area} className="enc-item">
              {area}
            </li>
          ))}
        </ul>
      ) : (
        <p className="enc-empty">
          {noData
            ? `Für ${versionLabel(version)} liegen leider keine Fangdaten vor.`
            : `In ${versionLabel(version)} nicht in der Wildnis zu fangen.`}
          {availableIn.length > 0 && <> Fangbar in: {availableIn.map(versionLabel).join(", ")}.</>}
        </p>
      )}
    </section>
  );
}
