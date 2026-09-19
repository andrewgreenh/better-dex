import {
  memo,
  startTransition,
  useLayoutEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { formatDexNo, spriteUrl, useDex, type DexPokemon, type StatSet } from "@/lib/dex";
import { readAnchor, rememberAnchor } from "@/lib/scroll";
import {
  METRICS,
  STAT_AXES,
  isMetricKey,
  statValue,
  strongerAttack,
  type MetricKey,
} from "@/lib/stats";

/** Query parameter holding the sorted-by value, e.g. /rangliste?wert=speed. */
const PARAM = "wert";

/**
 * The chosen value, kept in the URL so opening a Pokémon and coming back
 * restores the ranking. Taps replace the history entry, like the type filter.
 */
function useMetric() {
  const [params, setParams] = useSearchParams();
  const raw = params.get(PARAM);
  const metric = isMetricKey(raw) ? raw : null;

  const setMetric = (next: MetricKey | null) => {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        if (next) updated.set(PARAM, next);
        else updated.delete(PARAM);
        return updated;
      },
      { replace: true },
    );
  };

  return { metric, setMetric };
}

/**
 * Only the rows around the viewport are ever in the DOM. A pick re-sorts all
 * 1025 Pokémon, and with every row mounted that meant re-rendering and
 * physically moving a thousand elements, sprites included — quick on a
 * desktop, seconds on an iPhone. Windowed, a pick touches a few dozen rows.
 *
 * That works because the rows are a fixed height: a row's place follows from
 * its index alone. The numbers mirror .rank-row and .rank-list in styles.css.
 */
const ROW_GAP = 8;
const ROW_HEIGHT_NARROW = 123;
const ROW_HEIGHT_WIDE = 68;
const WIDE_QUERY = "(min-width: 720px)";
/** Rows kept ready beyond each edge of the screen, for fast flicks. */
const OVERSCAN = 12;
/** The window only moves in steps, so most scroll events change nothing. */
const STEP = 4;

interface RowWindow {
  start: number;
  end: number;
}

function rowPitch(): number {
  return (window.matchMedia(WIDE_QUERY).matches ? ROW_HEIGHT_WIDE : ROW_HEIGHT_NARROW) + ROW_GAP;
}

/** The slice of rows to mount when the list's top edge sits at `listTop`. */
function windowAt(listTop: number, pitch: number, count: number): RowWindow {
  const first = Math.floor(-listTop / pitch);
  const last = Math.ceil((window.innerHeight - listTop) / pitch);
  const start = Math.max(0, Math.floor((first - OVERSCAN) / STEP) * STEP);
  const end = Math.min(count, Math.ceil((last + OVERSCAN) / STEP) * STEP);
  return { start: Math.min(start, end), end };
}

interface RankedEntry {
  entry: DexPokemon;
  stats: StatSet;
  value: number;
  rank: number;
}

/**
 * One ranking row: place, sprite, the value it was sorted by, a bar relative
 * to the leader, and all six base stats so the whole spread is visible at a
 * glance. Memoised, so scrolling only renders the rows that come into range.
 */
const Row = memo(function Row({
  entry,
  stats,
  value,
  rank,
  metric,
  share,
}: RankedEntry & { metric: MetricKey; share: number }) {
  // For the two totals nothing is "the" stat — except that the relevant total
  // drops one attack stat, which the row marks as struck through.
  const dropped = metric === "totalRelevant" ? otherAttack(stats) : null;

  return (
    <a id={`r-${entry.id}`} className="rank-row" href={`/pokemon/${entry.id}`}>
      <span className={`rank-no${rank <= 3 ? ` medal-${rank}` : ""}`}>{rank}</span>
      <img src={spriteUrl(entry.id)} alt="" width={48} height={48} loading="lazy" decoding="sync" />
      <span className="rank-name">
        <b>{entry.name}</b>
        <span>{formatDexNo(entry.id)}</span>
      </span>
      <span className="rank-value">{value}</span>
      <span className="rank-bar">
        <i style={{ width: `${share}%` }} />
      </span>
      <span className="rank-stats">
        {STAT_AXES.map((axis) => {
          const state = axis.key === metric ? " on" : axis.key === dropped ? " off" : "";
          return (
            <span key={axis.key} className={`rank-stat${state}`}>
              <i>{axis.short}</i>
              {stats[axis.key]}
            </span>
          );
        })}
      </span>
    </a>
  );
});

function otherAttack(stats: StatSet): "attack" | "spAttack" {
  return strongerAttack(stats) === "attack" ? "spAttack" : "attack";
}

/** The ranking: pick a value up top, everything below sorts by it. */
export function StatRanking() {
  const { pokemon } = useDex();
  const { metric, setMetric } = useMetric();
  const navigate = useNavigate();
  // Named apart from the metric `key` the pills map over below.
  const { key: locationKey } = useLocation();

  // The list re-sorts and re-renders on every pick, which react-router runs
  // inside a transition — so the pills would only light up once that landed.
  // The optimistic copy paints the pressed state on the next frame instead.
  const [selected, showSelected] = useOptimistic(metric, (_, next: MetricKey | null) => next);

  const pick = (next: MetricKey | null) => {
    startTransition(() => {
      showSelected(next);
      setMetric(next);
    });
  };

  // Ranked on the default form's stats — the same form the list and its type
  // filter use, so Mega evolutions don't quietly outrank everything.
  const ranked = useMemo<RankedEntry[]>(() => {
    if (!metric) return [];
    const rows = pokemon.map((entry) => {
      const stats = entry.variants[0].stats;
      return { entry, stats, value: statValue(stats, metric), rank: 0 };
    });
    rows.sort((a, b) => b.value - a.value || a.entry.id - b.entry.id);
    // Equal values share a place (1, 2, 2, 4) — plenty of Pokémon tie.
    rows.forEach((row, index) => {
      row.rank = index > 0 && rows[index - 1].value === row.value ? rows[index - 1].rank : index + 1;
    });
    return rows;
  }, [pokemon, metric]);

  const top = ranked.length > 0 ? ranked[0].value : 0;

  const listRef = useRef<HTMLDivElement>(null);
  const [pitch, setPitch] = useState(rowPitch);

  // Coming back from a Pokémon, the tapped row has to be in the very first
  // render: the ScrollManager looks it up by id to put it back in place, and
  // at that point nothing has been measured or scrolled yet.
  const [rows, setRows] = useState<RowWindow>(() => {
    const anchor = readAnchor(locationKey);
    const index = anchor ? ranked.findIndex((row) => `r-${row.entry.id}` === anchor.id) : -1;
    const from = Math.max(0, index);
    return windowAt(-from * rowPitch(), rowPitch(), ranked.length);
  });

  const listed = selected !== null;
  const count = ranked.length;
  useLayoutEffect(() => {
    if (!listed) return;
    const media = window.matchMedia(WIDE_QUERY);
    const update = () => {
      const list = listRef.current;
      if (!list) return;
      const nextPitch = rowPitch();
      const next = windowAt(list.getBoundingClientRect().top, nextPitch, count);
      setPitch(nextPitch);
      setRows((current) =>
        current.start === next.start && current.end === next.end ? current : next,
      );
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    media.addEventListener("change", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      media.removeEventListener("change", update);
    };
  }, [listed, count]);

  // One handler for the whole list rather than 1025 <Link>s, as in the grid.
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const row = (event.target as Element).closest("a.rank-row");
    const href = row?.getAttribute("href");
    if (!href || !row) return;
    event.preventDefault();
    // Anchor the return on this row rather than on a pixel offset — see
    // lib/scroll for why the offset drifts.
    rememberAnchor(locationKey, row);
    navigate(href);
  };

  return (
    <>
      <div className="filter-bar" role="group" aria-label="Nach Wert sortieren">
        {METRICS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`filter-pill rank-pill${selected === key ? " on" : ""}`}
            aria-pressed={selected === key}
            onClick={() => pick(selected === key ? null : key)}
          >
            {label}
          </button>
        ))}
      </div>

      {selected === null ? (
        <p className="rank-empty">Tippe oben auf einen Wert.</p>
      ) : (
        <div
          ref={listRef}
          className="rank-list"
          onClick={onClick}
          style={{
            height: Math.max(0, count * pitch - ROW_GAP),
            paddingTop: rows.start * pitch,
          }}
        >
          {ranked.slice(rows.start, rows.end).map((row) => (
            <Row
              key={row.entry.id}
              {...row}
              metric={metric!}
              share={top > 0 ? Math.round((row.value / top) * 100) : 0}
            />
          ))}
        </div>
      )}
    </>
  );
}
