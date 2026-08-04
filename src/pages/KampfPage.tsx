import { useEffect, useReducer, useState } from "react";
import { Arena } from "@/components/battle/Arena";
import { DraftPicker } from "@/components/battle/DraftPicker";
import { HoldButton } from "@/components/battle/HoldButton";
import { TeamPicker } from "@/components/battle/TeamPicker";
import { TypeBadge } from "@/components/TypeBadge";
import { SwordIcon } from "@/components/icons";
import { artworkUrl, spriteUrl, useDex } from "@/lib/dex";
import { usePageTitle } from "@/lib/title";
import {
  HEARTS,
  PLAYER_NAMES,
  battleReducer,
  draftStep,
  loadBattle,
  other,
  picked,
  saveBattle,
  type BattleState,
  type PlayerId,
} from "@/lib/battle";

/** Start screen — mode plus the two settings that make it work for a four-year-old. */
function Setup({ state, onStart }: { state: BattleState; onStart: (teamSize: number, hints: boolean, speak: boolean) => void }) {
  const [hints, setHints] = useState(state.hints);
  const [speak, setSpeak] = useState(state.speak);

  return (
    <div className="battle-setup">
      <div className="page-head">
        <h1>Kampf</h1>
        <p>
          Zwei Spieler, ein Handy. Ihr wählt abwechselnd euer Team – der andere schaut weg.
          Danach kämpft ihr gegeneinander.
        </p>
      </div>

      <ol className="rules">
        <li>
          Jedes Pokémon hat <b>{HEARTS} Herzen</b> und kämpft mit seinen eigenen Typen.
        </li>
        <li>
          Jeder Angriff wird <b>gewürfelt</b> – der Typ entscheidet, wie stark der Würfel ist. Die
          höchste Zahl ist ein <b>Volltreffer</b>.
        </li>
        <li>
          <b>Mega effektiv</b> haut sofort um, <b>sehr effektiv</b> braucht zwei Treffer, ein
          normaler zwei bis vier.
        </li>
        <li>
          Der <b>Rempler</b> geht immer – für den Fall, dass nichts anderes wirkt. Wer die höhere{" "}
          <b>Initiative</b> hat, greift zuerst an.
        </li>
      </ol>

      <div className="setup-toggles">
        <label className="toggle">
          <input type="checkbox" checked={hints} onChange={(event) => setHints(event.target.checked)} />
          <span>Hilfe: Angriffe zeigen, wie gut sie wirken</span>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={speak} onChange={(event) => setSpeak(event.target.checked)} />
          <span>Vorlesen: was passiert ist, wird laut gesagt</span>
        </label>
      </div>

      <div className="setup-modes">
        <button type="button" className="mode-btn primary" onClick={() => onStart(3, hints, speak)}>
          <SwordIcon />
          <b>3 gegen 3</b>
          <span>Je drei Pokémon aussuchen</span>
        </button>
        <button type="button" className="mode-btn" onClick={() => onStart(1, hints, speak)}>
          <b>Schneller Kampf</b>
          <span>Nur ein Pokémon pro Spieler</span>
        </button>
      </div>
    </div>
  );
}

type PassMode = "opening" | "handover" | "peek";

/**
 * Stands in front of every screen that shows one player something the other
 * must not see: the draft, both lead choices and the pick after a knockout.
 */
function Pass({ to, mode, onDone }: { to: PlayerId; mode: PassMode; onDone: () => void }) {
  const me = PLAYER_NAMES[to];
  const you = PLAYER_NAMES[other(to)];
  const wording = {
    opening: { title: `${me} fängt an`, note: `${you} schaut weg – jede Wahl bleibt geheim.` },
    handover: {
      title: `Gib das Gerät jetzt weiter an ${me}`,
      note: `${you} schaut jetzt weg – die Wahl bleibt geheim.`,
    },
    peek: {
      title: `Nur ${me} darf jetzt schauen`,
      note: `${you} schaut weg – wer nachkommt, bleibt geheim.`,
    },
  }[mode];

  return (
    <div className={`pass p${to}`}>
      <p className="pass-kicker">Nicht schummeln!</p>
      <h1>{wording.title}</h1>
      <p className="pass-note">{wording.note}</p>
      <HoldButton label={`Ich bin ${me}`} onConfirm={onDone} />
    </div>
  );
}

export function KampfPage() {
  usePageTitle("Kampf – Better Dex");
  const { byId } = useDex();
  const [state, dispatch] = useReducer(battleReducer, undefined, loadBattle);

  useEffect(() => saveBattle(state), [state]);

  switch (state.phase) {
    case "setup":
      return (
        <main className="content-page battle-page">
          <Setup
            state={state}
            onStart={(teamSize, hints, speak) => dispatch({ type: "start", teamSize, hints, speak })}
          />
        </main>
      );

    case "pass":
      return (
        <main className="content-page battle-page">
          <Pass
            to={state.player}
            mode={
              state.next === "switch" ? "peek" : picked(state) === 0 ? "opening" : "handover"
            }
            onDone={() => dispatch({ type: "handOver" })}
          />
        </main>
      );

    case "draft":
      return (
        <main className="content-page battle-page">
          <DraftPicker
            player={state.player}
            step={draftStep(state)}
            teamSize={state.teamSize}
            own={state.sides[state.player].team.map((member) => member.id)}
            onPick={(id) => dispatch({ type: "pick", id })}
          />
        </main>
      );

    case "lead":
      return (
        <main className="content-page battle-page">
          <TeamPicker
            player={state.player}
            team={state.sides[state.player].team}
            title="Wer fängt an?"
            subtitle="Dieses Pokémon schickst du als erstes in den Kampf."
            onPick={(index) => dispatch({ type: "lead", index })}
          />
        </main>
      );

    case "reveal": {
      const leads = ([0, 1] as PlayerId[]).map((player) => {
        const side = state.sides[player];
        return byId.get(side.team[side.active].id);
      });
      if (!leads[0] || !leads[1]) return null;
      // The faster one opens — the only place a base stat decides anything.
      const speeds = leads.map((entry) => entry!.variants[0].stats.speed);
      const first: PlayerId = speeds[1] > speeds[0] ? 1 : 0;

      return (
        <main className="content-page battle-page">
          <div className="reveal">
            <h1>Los geht&apos;s!</h1>
            <div className="reveal-row">
              {([0, 1] as PlayerId[]).map((player) => (
                <div key={player} className={`reveal-side p${player}`}>
                  <span className="reveal-player">{PLAYER_NAMES[player]}</span>
                  <img src={artworkUrl(leads[player]!.id)} alt="" width={160} height={160} />
                  <b>{leads[player]!.name}</b>
                  <span className="reveal-types">
                    {leads[player]!.types.map((type) => (
                      <TypeBadge key={type} type={type} small />
                    ))}
                  </span>
                  <span className="reveal-speed">Initiative {speeds[player]}</span>
                </div>
              ))}
              <span className="reveal-vs">VS</span>
            </div>
            <p className="reveal-first">
              {leads[first]!.name} ist schneller – {PLAYER_NAMES[first]} greift zuerst an.
            </p>
            <button
              type="button"
              className="mode-btn primary"
              onClick={() => dispatch({ type: "go", first })}
            >
              <b>Kampf starten</b>
            </button>
          </div>
        </main>
      );
    }

    case "battle":
      return (
        <main className="content-page battle-page">
          <Arena
            state={state}
            onAttack={(result) => dispatch({ type: "attack", result })}
            onConfirm={() => dispatch({ type: "confirm" })}
          />
        </main>
      );

    case "switch":
      return (
        <main className="content-page battle-page">
          <TeamPicker
            player={state.player}
            team={state.sides[state.player].team}
            title="Wer kommt jetzt?"
            subtitle="Dein Pokémon ist besiegt. Das nächste darf sofort angreifen."
            onPick={(index) => dispatch({ type: "send", index })}
          />
        </main>
      );

    case "over": {
      const winner = state.winner ?? 0;
      return (
        <main className="content-page battle-page">
          <div className={`victory p${winner}`}>
            <h1>{PLAYER_NAMES[winner]} gewinnt!</h1>
            <div className="victory-teams">
              {([0, 1] as PlayerId[]).map((player) => (
                <div key={player} className={`victory-team p${player}`}>
                  <span className="victory-label">
                    {PLAYER_NAMES[player]}
                    {player === winner ? " 🏆" : ""}
                  </span>
                  <div className="victory-row">
                    {state.sides[player].team.map((member, index) => (
                      <span
                        key={index}
                        className={`victory-slot${member.hearts === 0 ? " out" : ""}`}
                      >
                        <img src={spriteUrl(member.id)} alt={byId.get(member.id)?.name ?? ""} width={64} height={64} />
                        <i>{member.hearts === 0 ? "besiegt" : `${member.hearts} ♥`}</i>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="victory-actions">
              <button type="button" className="mode-btn primary" onClick={() => dispatch({ type: "again" })}>
                <b>Nochmal spielen</b>
              </button>
              <button type="button" className="mode-btn" onClick={() => dispatch({ type: "quit" })}>
                <b>Fertig</b>
              </button>
            </div>
          </div>
        </main>
      );
    }
  }
}
