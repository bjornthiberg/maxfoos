import { Rank, FormPips } from "./Standing";
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
    <div className="table-scroll">
      <table className="score-table">
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
          {sortedPlayers.map((player, index) => (
            <tr key={player.name}>
              <td>
                <Rank position={index + 1} />
              </td>
              <td className="score-name">{player.name}</td>
              <td className="score-main">
                {(player.winRate * 100).toFixed(1)}%
              </td>
              <td>{player.points}</td>
              <td>{player.gamesPlayed}</td>
              <td className={player.goalDifference >= 0 ? "" : "score-neg"}>
                {player.goalDifference >= 0 ? "+" : ""}
                {player.goalDifference}
              </td>
              <td>
                <FormPips form={getForm(player.name, recentGames)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
