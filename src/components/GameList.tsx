import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Game } from "../services/api";

const INITIAL_LIMIT = 5;

interface GameListProps {
  games: Game[];
  title: string;
  collapsible?: boolean;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
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

function TeamPlayers({ team }: { team: { player1: string; player2: string } }) {
  return (
    <div className="match-team-players">
      <div className="match-player">
        <span className="match-player-role">Back</span>
        <span className="match-player-name">{team.player1}</span>
      </div>
      <div className="match-player">
        <span className="match-player-role">Forward</span>
        <span className="match-player-name">{team.player2}</span>
      </div>
    </div>
  );
}

export default function GameList({
  games,
  title,
  collapsible = false,
  onDelete,
  showDelete = false,
}: GameListProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleGames =
    collapsible && !expanded ? games.slice(0, INITIAL_LIMIT) : games;
  const hasMore = collapsible && games.length > INITIAL_LIMIT;

  return (
    <div className="game-list-container">
      <h2>{title}</h2>
      {games.length === 0 ? (
        <p style={{ color: "#71717a", fontStyle: "italic" }}>
          Inga matcher spelade än.
        </p>
      ) : (
        <>
          <div className="match-list">
            {visibleGames.map((game) => {
              const team1Won = game.winner === "team1";
              return (
                <div key={game.id} className="match-card">
                  <div
                    className={`match-team match-team-blue ${team1Won ? "match-team-winner" : "match-team-loser"}`}
                  >
                    <TeamPlayers team={game.team1} />
                  </div>

                  <div className="match-score-block">
                    <div className="match-score">
                      <span
                        className={
                          team1Won ? "match-score-winner" : "match-score-loser"
                        }
                      >
                        {game.score.team1}
                      </span>
                      <span className="match-score-sep">–</span>
                      <span
                        className={
                          !team1Won ? "match-score-winner" : "match-score-loser"
                        }
                      >
                        {game.score.team2}
                      </span>
                    </div>
                    <div className="match-date">
                      {formatDate(game.timestamp)}
                    </div>
                    {showDelete && (
                      <button
                        onClick={() => onDelete && onDelete(game.id)}
                        className="delete-btn"
                        style={{
                          marginTop: "0.5rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                        }}
                      >
                        <Trash2 size={13} />
                        Ta bort
                      </button>
                    )}
                  </div>

                  <div
                    className={`match-team match-team-red ${!team1Won ? "match-team-winner" : "match-team-loser"}`}
                  >
                    <TeamPlayers team={game.team2} />
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <button
              className="expand-btn"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? "Visa färre" : `Visa alla ${games.length} matcher`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
