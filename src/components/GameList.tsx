import type { Game, UnplayedGame } from "../services/api";

interface GameListProps {
  games?: Game[];
  unplayedGames?: UnplayedGame[];
  title: string;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

function formatTeam(team: { player1: string; player2: string }): string {
  return `${team.player1} + ${team.player2}`;
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default function GameList({
  games,
  unplayedGames,
  title,
  onDelete,
  showDelete = false,
}: GameListProps) {
  if (games) {
    // Display played games
    return (
      <div className="game-list-container">
        <h2>{title}</h2>
        {games.length === 0 ? (
          <p>Inga matcher spelade än.</p>
        ) : (
          <table className="game-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Lag 1</th>
                <th>Lag 2</th>
                <th>Resultat</th>
                {showDelete && <th>Åtgärd</th>}
              </tr>
            </thead>
            <tbody>
              {games.map((game) => {
                const team1Won = game.winner === "team1";
                return (
                  <tr key={game.id}>
                    <td>{formatDate(game.timestamp)}</td>
                    <td className={team1Won ? "winner" : ""}>
                      {formatTeam(game.team1)}
                    </td>
                    <td className={!team1Won ? "winner" : ""}>
                      {formatTeam(game.team2)}
                    </td>
                    <td>
                      <strong>
                        {game.score.team1} - {game.score.team2}
                      </strong>
                    </td>

                    {showDelete && (
                      <td>
                        <button
                          onClick={() => onDelete && onDelete(game.id)}
                          className="delete-btn"
                        >
                          Ta bort
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  if (unplayedGames) {
    // Display unplayed games
    return (
      <div className="game-list-container">
        <h2>{title}</h2>
        <p className="game-count">Totalt: {unplayedGames.length} matcher</p>
        {unplayedGames.length === 0 ? (
          <p>Alla matcher har spelats!</p>
        ) : (
          <table className="game-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Lag 1</th>
                <th>Lag 2</th>
              </tr>
            </thead>
            <tbody>
              {unplayedGames.map((game, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{formatTeam(game.team1)}</td>
                  <td>{formatTeam(game.team2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  return null;
}
