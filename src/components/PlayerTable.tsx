import { Trophy, Medal, Award } from "lucide-react";
import type { Player, Game } from "../services/api";

interface PlayerTableProps {
  players: Player[];
  recentGames?: Game[];
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

export default function PlayerTable({
  players,
  recentGames = [],
}: PlayerTableProps) {
  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy size={18} color="#f59e0b" />;
    if (index === 1) return <Medal size={18} color="#94a3b8" />;
    if (index === 2) return <Award size={18} color="#c2410c" />;
    return null;
  };

  const sortedPlayers = [...players]
    .map((p) => ({
      ...p,
      winRate: p.gamesPlayed > 0 ? p.points / p.gamesPlayed : 0,
    }))
    .sort((a, b) => {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      return b.points - a.points;
    });

  return (
    <div className="player-table-container">
      <h2>Tabell</h2>
      <table className="player-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Spelare</th>
            <th>V%</th>
            <th>V</th>
            <th>M</th>
            <th>+/-</th>
            <th>Form</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player, index) => {
            const form = getForm(player.name, recentGames);
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
                <td>{(player.winRate * 100).toFixed(1)}%</td>
                <td style={{ fontWeight: "700" }}>{player.points}</td>
                <td>{player.gamesPlayed}</td>
                <td
                  className={
                    player.goalDifference >= 0 ? "positive" : "negative"
                  }
                >
                  {player.goalDifference >= 0 ? "+" : ""}
                  {player.goalDifference}
                </td>
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
    </div>
  );
}
