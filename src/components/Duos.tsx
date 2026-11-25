import { useMemo, useState } from "react";
import type { Game } from "../services/api";
import { computeDuos, findDuo, winRate } from "../lib/duos";
import type { Duo, DuoRecord } from "../lib/duos";

const pct = (r: DuoRecord) => `${Math.round(winRate(r) * 100)}%`;
const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)}`;

interface DuosProps {
  allPlayers: string[];
  games: Game[];
}

/**
 * Columns for the select grid: the count (5, 4 or 3) that leaves the fewest
 * empty slots in the last row, preferring wider rows. 9 players → 3×3.
 */
function gridColumns(n: number): number {
  const empty = (c: number) => (c - (n % c)) % c;
  return [5, 4, 3].reduce((best, c) => (empty(c) < empty(best) ? c : best));
}

/** Character-select screen for two teammates: pick 1P, then 2P. */
export default function Duos({ allPlayers, games }: DuosProps) {
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");

  const duos = useMemo(() => computeDuos(games), [games]);
  // only players who have played this season
  const active = useMemo(() => {
    const played = new Set(
      games.flatMap((g) => [
        g.team1.player1,
        g.team1.player2,
        g.team2.player1,
        g.team2.player2,
      ]),
    );
    return allPlayers.filter((p) => played.has(p));
  }, [allPlayers, games]);
  const duo = p1 && p2 ? findDuo(duos, p1, p2) : undefined;

  const pick = (name: string) => {
    if (name === p1) {
      // dropping 1P promotes 2P
      setP1(p2);
      setP2("");
    } else if (name === p2) {
      setP2("");
    } else if (!p1) {
      setP1(name);
    } else {
      setP2(name);
    }
  };

  return (
    <section className="cabinet glow-yellow">
      <div className="crt">
        <div className="screen-head">
          <h2 className="screen-title">Duos</h2>
          {!p2 && (
            <span className="screen-note">
              {p1 ? "Välj medspelare" : "Välj två spelare"}
            </span>
          )}
        </div>

        <div
          className="duo-select"
          role="group"
          aria-label="Välj två spelare"
          style={{ "--cols": gridColumns(active.length) } as React.CSSProperties}
        >
          {active.map((name) => {
            const slot = name === p1 ? "1P" : name === p2 ? "2P" : null;
            const withP1 = p1 && !slot ? findDuo(duos, p1, name) : undefined;
            return (
              <button
                key={name}
                type="button"
                className={`duo-tile ${slot ? `is-${slot.toLowerCase()}` : ""} ${p1 && !slot && !withP1 ? "is-unplayed" : ""}`}
                aria-pressed={!!slot}
                onClick={() => pick(name)}
              >
                {slot && <span className="duo-tile-slot">{slot}</span>}
                <span className="duo-tile-name">{name}</span>
                {p1 && !slot && (
                  <span className="duo-tile-hint">
                    {withP1 ? pct(withP1) : "–"}
                    {withP1 && <small> {withP1.games} M</small>}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {p1 && p2 ? (
          duo ? (
            <DuoCard key={`${p1}+${p2}`} duo={duo} p1={p1} p2={p2} />
          ) : (
            <p className="screen-prompt">
              {p1} och {p2} har inte spelat i samma lag ännu.
            </p>
          )
        ) : null}
      </div>
    </section>
  );
}

function DuoCard({ duo, p1, p2 }: { duo: Duo; p1: string; p2: string }) {
  const lineups: [string, string][] = [
    [p1, p2],
    [p2, p1],
  ];
  return (
    <div className="duo-card">
      <div className="duo-names">
        <span className="duo-name-1p">{p1}</span>
        <span className="duo-amp">&amp;</span>
        <span className="duo-name-2p">{p2}</span>
      </div>

      <div className="duo-record" aria-label={`${duo.wins} vinster, ${duo.losses} förluster`}>
        <span className="duo-record-w">{duo.wins}</span>
        <span className="duo-record-sep">–</span>
        <span className="duo-record-l">{duo.losses}</span>
      </div>

      <dl className="duo-figures">
        <div>
          <dt>V%</dt>
          <dd>{pct(duo)}</dd>
        </div>
        <div>
          <dt>+/-</dt>
          <dd>{signed(duo.goalDifference)}</dd>
        </div>
        <div>
          <dt>M</dt>
          <dd>{duo.games}</dd>
        </div>
      </dl>

      <ol className="duo-tape" aria-label="Matcher tillsammans, äldst först">
        {duo.results.map((won, i) => (
          <li
            key={i}
            className={won ? "is-w" : "is-l"}
            title={won ? "Vinst" : "Förlust"}
          />
        ))}
      </ol>

      <table className="duo-lineups">
        <thead>
          <tr>
            <th>Back</th>
            <th>Forward</th>
            <th>V–F</th>
            <th>+/-</th>
          </tr>
        </thead>
        <tbody>
          {lineups.map(([back, forward]) => {
            const r = duo.byBack[back];
            return (
              <tr key={back} className={r ? "" : "is-unplayed"}>
                <td>{back}</td>
                <td>{forward}</td>
                <td>{r ? `${r.wins}–${r.losses}` : "–"}</td>
                <td>{r ? signed(r.goalDifference) : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
