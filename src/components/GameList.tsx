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
    <>
      <div className="result-player">
        <span className="result-role" data-short="B">
          Back
        </span>
        <span className="result-name">{team.player1}</span>
      </div>
      <div className="result-player">
        <span className="result-role" data-short="F">
          Forward
        </span>
        <span className="result-name">{team.player2}</span>
      </div>
    </>
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
    <section className="cabinet glow-cyan">
      <div className="crt">
        <div className="screen-head">
          <h2 className="screen-title">{title}</h2>
        </div>
        {games.length === 0 ? (
          <p className="screen-prompt">Inga matcher spelade än.</p>
        ) : (
          <div className="results">
            {visibleGames.map((game) => {
              const team1Won = game.winner === "team1";
              return (
                <div key={game.id} className="result">
                  <div
                    className={`result-team result-team-blue ${team1Won ? "is-winner" : "is-loser"}`}
                  >
                    <TeamPlayers team={game.team1} />
                  </div>

                  <div className="result-mid">
                    <div className="result-score">
                      <span className={team1Won ? "is-winner" : "is-loser"}>
                        {game.score.team1}
                      </span>
                      <span className="result-score-sep">–</span>
                      <span className={!team1Won ? "is-winner" : "is-loser"}>
                        {game.score.team2}
                      </span>
                    </div>
                    <div className="result-date">
                      {formatDate(game.timestamp)}
                    </div>
                    {showDelete && (
                      <button
                        onClick={() => onDelete && onDelete(game.id)}
                        className="result-delete"
                      >
                        <Trash2 size={13} />
                        Ta bort
                      </button>
                    )}
                  </div>

                  <div
                    className={`result-team result-team-red ${!team1Won ? "is-winner" : "is-loser"}`}
                  >
                    <TeamPlayers team={game.team2} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {hasMore && (
        <div className="cabinet-deck cabinet-deck-center">
          <button
            className="arcade-btn arcade-btn-ghost"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Visa färre" : `Visa alla ${games.length} matcher`}
          </button>
        </div>
      )}
    </section>
  );
}
