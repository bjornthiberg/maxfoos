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
    <section className="cabinet glow-green">
      <div className="crt">
        <div className="screen-head">
          <h2 className="screen-title">Head-to-head</h2>
        </div>

        {!stats && (
          <p className="screen-prompt">
            Välj två spelare för att se inbördes möten.
          </p>
        )}

        {stats && total === 0 && (
          <p className="screen-prompt">
            Inga matcher spelade mot varandra ännu.
          </p>
        )}

        {stats && total > 0 && (
          <div className="versus-board">
            <div className="versus-score">
              <div
                className={`versus-side ${stats.winsA > stats.winsB ? "is-leader" : ""}`}
              >
                <span className="versus-name">{playerA}</span>
                <span className="versus-wins">{stats.winsA}</span>
              </div>
              <div className="versus-total">{total} matcher</div>
              <div
                className={`versus-side versus-side-b ${stats.winsB > stats.winsA ? "is-leader" : ""}`}
              >
                <span className="versus-name">{playerB}</span>
                <span className="versus-wins">{stats.winsB}</span>
              </div>
            </div>

            <div className="versus-bar" aria-hidden="true">
              <span
                className={stats.winsA > stats.winsB ? "is-leader" : ""}
                style={{ flexGrow: stats.winsA }}
              />
              <span
                className={stats.winsB > stats.winsA ? "is-leader" : ""}
                style={{ flexGrow: stats.winsB }}
              />
            </div>

            <div className="versus-games">
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
                    className="versus-game"
                    title={`${aWon ? playerA : playerB} vann`}
                  >
                    <span>{aWon && <span className="versus-mark" />}</span>
                    <span className="versus-game-score">
                      {scoreA} – {scoreB}
                    </span>
                    <span className="versus-game-date">
                      {formatDate(game.timestamp)}
                    </span>
                    <span>{!aWon && <span className="versus-mark" />}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="cabinet-deck cabinet-deck-stack">
        <div className="versus-pick">
          <select
            value={playerA}
            onChange={(e) => setPlayerA(e.target.value)}
            className="select h2h-select"
            aria-label="Spelare 1"
          >
            <option value="">Välj spelare...</option>
            {availableForA.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <span className="vs">VS</span>

          <select
            value={playerB}
            onChange={(e) => setPlayerB(e.target.value)}
            className="select h2h-select"
            aria-label="Spelare 2"
          >
            <option value="">Välj spelare...</option>
            {availableForB.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
