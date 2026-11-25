import { K_FACTOR } from "../lib/elo";
import type { EloGame, EloTeamChange } from "../lib/elo";

const pct = (p: number) => `${Math.round(p * 100)}%`;
const signed = (n: number, digits = 0) =>
  `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(digits)}`;

function Side({ team, side }: { team: EloTeamChange; side: "blue" | "red" }) {
  return (
    <div className={`elo-side elo-side-${side}`}>
      <div className="elo-team-rating" title="Lagets snittbetyg före matchen">
        Ø {Math.round(team.rating)}
      </div>
      <div
        className="elo-formula"
        title="K × (resultat − förväntat) = ändring per spelare"
      >
        {K_FACTOR} × ({team.score} − {team.expected.toFixed(2)}) ={" "}
        <b className={team.delta >= 0 ? "elo-up" : "elo-down"}>
          {signed(team.delta, 1)}
        </b>
      </div>
      <ul className="elo-players">
        {team.players.map((p) => (
          <li key={p.name} className={p.guest ? "is-guest" : ""}>
            <span className="elo-player-name">{p.name}</span>
            <span className="elo-player-change">
              {p.guest ? (
                <>gäst · {Math.round(p.before)}</>
              ) : (
                <>
                  {Math.round(p.before)} → {Math.round(p.after)}
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Why each player's rating moved in one game: odds, formula, before → after. */
export default function EloBreakdown({ game }: { game: EloGame }) {
  const { team1, team2 } = game;
  return (
    <div className="elo-breakdown">
      <div className="elo-odds">
        <span className="elo-odds-blue">{pct(team1.expected)}</span>
        <span className="elo-odds-label">ELO-vinstchans</span>
        <span className="elo-odds-red">{pct(team2.expected)}</span>
      </div>
      <div className="elo-bar" aria-hidden>
        <span style={{ width: pct(team1.expected) }} />
      </div>
      <div className="elo-sides">
        <Side team={team1} side="blue" />
        <Side team={team2} side="red" />
      </div>
    </div>
  );
}
