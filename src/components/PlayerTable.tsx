import { Trophy, Medal, Award } from "lucide-react";
import type { Player } from "../services/api";

interface PlayerTableProps {
  players: Player[];
}

export default function PlayerTable({ players }: PlayerTableProps) {
  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy size={18} color="#f59e0b" />;
    if (index === 1) return <Medal size={18} color="#94a3b8" />;
    if (index === 2) return <Award size={18} color="#c2410c" />;
    return null;
  };

  return (
    <div className="player-table-container">
      <h2>Tabell</h2>
      <table className="player-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Spelare</th>
            <th>V</th>
            <th>M</th>
            <th>+/-</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
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
              <td style={{ fontWeight: "700" }}>{player.points}</td>
              <td>{player.gamesPlayed}</td>
              <td
                className={player.goalDifference >= 0 ? "positive" : "negative"}
              >
                {player.goalDifference >= 0 ? "+" : ""}
                {player.goalDifference}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
