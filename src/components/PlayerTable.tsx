import type { Player } from "../services/api";

interface PlayerTableProps {
  players: Player[];
}

export default function PlayerTable({ players }: PlayerTableProps) {
  return (
    <div className="player-table-container">
      <h2>Tabell</h2>
      <table className="player-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Spelare</th>
            <th>Poäng</th>
            <th>Spelade matcher</th>
            <th>Gjorda mål</th>
            <th>Insläppta mål</th>
            <th>Målskillnad</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr key={player.name}>
              <td>{index + 1}</td>
              <td>
                <strong>{player.name}</strong>
              </td>
              <td>{player.points}</td>
              <td>{player.gamesPlayed}</td>
              <td>{player.goalsFor}</td>
              <td>{player.goalsAgainst}</td>
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
