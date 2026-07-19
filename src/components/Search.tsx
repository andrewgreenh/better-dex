import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDexNo, spriteUrl, useDex } from "@/lib/dex";
import { SearchIcon } from "./icons";

/** Case- and diacritic-insensitive matching so "glumanda" or "flabebe" work. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function Search() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { pokemon } = useDex();

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const results = query.trim()
    ? pokemon.filter((entry) => normalize(entry.name).includes(normalize(query.trim()))).slice(0, 20)
    : [];

  const go = (id: number) => {
    setOpen(false);
    setQuery("");
    navigate(`/pokemon/${id}`);
  };

  return (
    <>
      <button type="button" className="search-open" onClick={() => setOpen(true)}>
        <SearchIcon />
        <span className="hint">Pokémon suchen…</span>
      </button>

      {open && (
        <div
          className="search-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="search-box" role="dialog" aria-label="Pokémon suchen">
            <div className="search-input-row">
              <SearchIcon />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && results.length > 0) go(results[0].id);
                }}
                placeholder="Pokémon suchen…"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button type="button" className="search-close" onClick={() => setOpen(false)}>
                Schließen
              </button>
            </div>
            <div className="search-results">
              {query.trim() === "" ? (
                <p className="search-empty">Tippe den Namen eines Pokémon ein</p>
              ) : results.length === 0 ? (
                <p className="search-empty">Keine Treffer für „{query.trim()}“</p>
              ) : (
                results.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="search-result"
                    style={{ width: "100%" }}
                    onClick={() => go(entry.id)}
                  >
                    <img src={spriteUrl(entry.id)} alt="" width={44} height={44} loading="lazy" />
                    <b>{entry.name}</b>
                    <span>{formatDexNo(entry.id)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
