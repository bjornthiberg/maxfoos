import { Trophy, Medal, Award } from "lucide-react";
import type { Game, Player } from "../services/api";

interface EloPlayer {
  name: string;
  elo: number;
  change: number;
  gamesPlayed: number;
}

function calculateElo(games: Game[]): EloPlayer[] {
  const K = 32;
  const elos: Record<string, number> = {};
  const gamesPlayed: Record<string, number> = {};

  const players = new Set<string>();
  games.forEach((g) => {
    [
      g.team1.player1,
      g.team1.player2,
      g.team2.player1,
      g.team2.player2,
    ].forEach((p) => players.add(p));
  });
  players.forEach((p) => {
    elos[p] = 1000;
    gamesPlayed[p] = 0;
  });

  const sorted = [...games].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  sorted.forEach((game) => {
    const t1 = [game.team1.player1, game.team1.player2];
    const t2 = [game.team2.player1, game.team2.player2];

    const avg1 = (elos[t1[0]] + elos[t1[1]]) / 2;
    const avg2 = (elos[t2[0]] + elos[t2[1]]) / 2;

    const exp1 = 1 / (1 + Math.pow(10, (avg2 - avg1) / 400));
    const exp2 = 1 - exp1;

    const s1 = game.winner === "team1" ? 1 : 0;
    const s2 = 1 - s1;

    t1.forEach((p) => {
      elos[p] += K * (s1 - exp1);
      gamesPlayed[p]++;
    });
    t2.forEach((p) => {
      elos[p] += K * (s2 - exp2);
      gamesPlayed[p]++;
    });
  });

  return Array.from(players)
    .map((name) => ({
      name,
      elo: Math.round(elos[name]),
      change: Math.round(elos[name] - 1000),
      gamesPlayed: gamesPlayed[name],
    }))
    .sort((a, b) => b.elo - a.elo);
}

function getForm(playerName: string, games: Game[]): ("W" | "L")[] {
  return games
    .filter((g) =>
      [
        g.team1.player1,
        g.team1.player2,
        g.team2.player1,
        g.team2.player2,
      ].includes(playerName),
    )
    .slice(0, 5)
    .map((g) => {
      const inTeam1 =
        g.team1.player1 === playerName || g.team1.player2 === playerName;
      return (inTeam1 && g.winner === "team1") ||
        (!inTeam1 && g.winner === "team2")
        ? "W"
        : "L";
    });
}

const getRankIcon = (index: number) => {
  if (index === 0) return <Trophy size={18} color="#f59e0b" />;
  if (index === 1) return <Medal size={18} color="#94a3b8" />;
  if (index === 2) return <Award size={18} color="#c2410c" />;
  return null;
};

export default function EloTable({
  games,
  players: playerStats,
}: {
  games: Game[];
  players: Player[];
}) {
  const players = calculateElo(games).map((p) => ({
    ...p,
    goalDifference:
      playerStats.find((s) => s.name === p.name)?.goalDifference ?? 0,
  }));

  return (
    <table className="player-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Spelare</th>
          <th>ELO</th>
          <th>+/-</th>
          <th>M</th>
          <th>Form</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player, index) => {
          const form = getForm(player.name, games);
          return (
            <tr key={player.name}>
              <td>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {getRankIcon(index)}
                  <span style={{ fontWeight: index < 3 ? "700" : "500" }}>
                    {index + 1}
                  </span>
                </div>
              </td>
              <td>
                <strong>{player.name}</strong>
              </td>
              <td style={{ fontWeight: "700" }}>{player.elo}</td>
              <td
                className={player.goalDifference >= 0 ? "positive" : "negative"}
              >
                {player.goalDifference >= 0 ? "+" : ""}
                {player.goalDifference}
              </td>
              <td>{player.gamesPlayed}</td>
              <td>
                <div className="form-dots">
                  {form.map((result, i) => (
                    <span
                      key={i}
                      className={`form-dot form-dot-${result === "W" ? "w" : "l"}`}
                      title={result === "W" ? "Vinst" : "Förlust"}
                    />
                  ))}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
