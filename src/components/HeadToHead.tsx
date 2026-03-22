import { useState } from "react";
import type { Game } from "../services/api";

interface HeadToHeadProps {
  allPlayers: string[];
  games: Game[];
}

interface H2HStats {
  winsA: number;
  winsB: number;
  games: { game: Game; aWon: boolean }[];
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function computeH2H(playerA: string, playerB: string, games: Game[]): H2HStats {
  const h2hGames = games.filter((g) => {
    const t1 = [g.team1.player1, g.team1.player2];
    const t2 = [g.team2.player1, g.team2.player2];
    return (
      (t1.includes(playerA) && t2.includes(playerB)) ||
      (t1.includes(playerB) && t2.includes(playerA))
    );
  });

  let winsA = 0,
    winsB = 0;
  const annotated = h2hGames.map((g) => {
    const aOnTeam1 = [g.team1.player1, g.team1.player2].includes(playerA);
    const aWon =
      (aOnTeam1 && g.winner === "team1") || (!aOnTeam1 && g.winner === "team2");
    if (aWon) winsA++;
    else winsB++;
    return { game: g, aWon };
  });

  return { winsA, winsB, games: annotated };
}

export default function HeadToHead({ allPlayers, games }: HeadToHeadProps) {
  const [playerA, setPlayerA] = useState("");
  const [playerB, setPlayerB] = useState("");

  const stats =
    playerA && playerB && playerA !== playerB
      ? computeH2H(playerA, playerB, games)
      : null;

  const availableForA = allPlayers.filter((p) => p !== playerB);
  const availableForB = allPlayers.filter((p) => p !== playerA);

  const total = stats ? stats.winsA + stats.winsB : 0;

  return (
    <div className="h2h-container">
      <h2>Head-to-head</h2>
      <p className="quartet-description">
        Välj två spelare för att se inbördes möten
      </p>

      <div className="h2h-selectors">
        <select
          value={playerA}
          onChange={(e) => setPlayerA(e.target.value)}
          className="player-select h2h-select"
        >
          <option value="">Välj spelare...</option>
          {availableForA.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <span className="h2h-vs">vs</span>

        <select
          value={playerB}
          onChange={(e) => setPlayerB(e.target.value)}
          className="player-select h2h-select"
        >
          <option value="">Välj spelare...</option>
          {availableForB.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {stats && total === 0 && (
        <div className="h2h-empty">Inga matcher spelade mot varandra ännu.</div>
      )}

      {stats && total > 0 && (
        <div className="h2h-results">
          <div className="h2h-scoreboard">
            <div
              className={`h2h-player-stat ${stats.winsA > stats.winsB ? "h2h-leader" : ""}`}
            >
              <div className="h2h-player-name">{playerA}</div>
              <div className="h2h-wins">{stats.winsA}</div>
            </div>

            <div className="h2h-divider">
              <div className="h2h-total">{total} matcher</div>
            </div>

            <div
              className={`h2h-player-stat h2h-player-stat-right ${stats.winsB > stats.winsA ? "h2h-leader" : ""}`}
            >
              <div className="h2h-player-name">{playerB}</div>
              <div className="h2h-wins">{stats.winsB}</div>
            </div>
          </div>

          <div className="h2h-game-list">
            {stats.games.map(({ game, aWon }) => {
              const aOnTeam1 = [
                game.team1.player1,
                game.team1.player2,
              ].includes(playerA);
              const scoreA = aOnTeam1 ? game.score.team1 : game.score.team2;
              const scoreB = aOnTeam1 ? game.score.team2 : game.score.team1;
              return (
                <div
                  key={game.id}
                  className={`h2h-game-row ${aWon ? "h2h-a-won" : "h2h-b-won"}`}
                >
                  <span
                    className={`h2h-game-name ${aWon ? "h2h-game-winner" : ""}`}
                  >
                    {playerA}
                  </span>
                  <span className="h2h-game-score">
                    {scoreA} – {scoreB}
                  </span>
                  <span
                    className={`h2h-game-name h2h-game-name-right ${!aWon ? "h2h-game-winner" : ""}`}
                  >
                    {playerB}
                  </span>
                  <span className="h2h-game-date">
                    {formatDate(game.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
