import { memo, startTransition, useMemo, useOptimistic, type MouseEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { formatDexNo, spriteUrl, useDex, type DexPokemon, type StatSet } from "@/lib/dex";
import { rememberAnchor } from "@/lib/scroll";
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

interface RankedEntry {
  entry: DexPokemon;
  stats: StatSet;
  value: number;
  rank: number;
}

/**
 * One ranking row: place, sprite, the value it was sorted by, a bar relative
 * to the leader, and all six base stats so the whole spread is visible at a
 * glance. Memoised — a metric change re-renders 1025 of these.
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
        <div className="rank-list" onClick={onClick}>
          {ranked.map((row) => (
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
