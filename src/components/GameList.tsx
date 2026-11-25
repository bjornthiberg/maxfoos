import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Game, Team } from "../services/api";
import { shownDelta } from "../lib/elo";
import type { EloGame, EloTeamChange, EloPlayerChange } from "../lib/elo";
import EloBreakdown from "./EloBreakdown";

const INITIAL_LIMIT = 5;
/** Games are first to 10; the rod grows if a score ever goes beyond. */
const BEADS = 10;

interface GameListProps {
  games: Game[];
  title: string;
  collapsible?: boolean;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
  /** Per-game ELO breakdown; when given, each game shows rating changes */
  elo?: Map<string, EloGame>;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ["13 okt", "10:08"], with the year only when it isn't this year */
function formatWhen(timestamp: string): [string, string] {
  const d = new Date(timestamp);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const date = d
    .toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "short",
      ...(sameYear ? {} : { year: "numeric" }),
    })
    .replace(".", "");
  return [date, `${pad(d.getHours())}:${pad(d.getMinutes())}`];
}

/** Bead colours on the real counter: 5 in the team's colour, 3 gray, 2 white */
const beadTone = (i: number) => (i < 5 ? "team" : i < 8 ? "gray" : "white");

/** The table's bead counter: one bead per goal, lit from the team's own end. */
function Rod({
  goals,
  of,
  side,
  won,
}: {
  goals: number;
  of: number;
  side: Side;
  won: boolean;
}) {
  return (
    <span
      className={`rod rod-${side} ${won ? "is-won" : "is-lost"}`}
      aria-hidden
    >
      {Array.from({ length: of }, (_, i) => (
        <i key={i} className={i < goals ? `is-lit tone-${beadTone(i)}` : ""} />
      ))}
    </span>
  );
}

type Side = "blue" | "red";

function EloDelta({ change }: { change?: EloPlayerChange }) {
  // Guests have no rating to move
  if (!change || change.guest) return null;
  const d = shownDelta(change);
  return (
    <span
      className="lineup-elo"
      title={`ELO ${Math.round(change.before)} → ${Math.round(change.after)}`}
    >
      {d > 0 ? "+" : d < 0 ? "−" : "±"}
      {Math.abs(d)}
    </span>
  );
}

function Lineup({
  team,
  side,
  won,
  elo,
}: {
  team: Team;
  side: Side;
  won: boolean;
  elo?: EloTeamChange;
}) {
  const players = [
    { name: team.player1, role: "Back", short: "B", change: elo?.players[0] },
    {
      name: team.player2,
      role: "Forward",
      short: "F",
      change: elo?.players[1],
    },
  ];
  return (
    <div
      className={`lineup lineup-${side} ${won ? "is-won" : "is-lost"}`}
      aria-label={`Lag ${side === "blue" ? "Blå" : "Röd"}${won ? ", vinnare" : ""}`}
    >
      {players.map((p) => (
        <div key={p.role} className="lineup-player">
          <span className="lineup-role" title={p.role}>
            {p.short}
          </span>
          <span className="lineup-name">{p.name}</span>
          <EloDelta change={p.change} />
        </div>
      ))}
    </div>
  );
}

export default function GameList({
  games,
  title,
  collapsible = false,
  onDelete,
  showDelete = false,
  elo,
}: GameListProps) {
  const [expanded, setExpanded] = useState(false);
  const [openGame, setOpenGame] = useState<string | null>(null);
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
          <ol className="matches">
            {visibleGames.map((game) => {
              const blueWon = game.winner === "team1";
              const { team1: blueGoals, team2: redGoals } = game.score;
              const beads = Math.max(BEADS, blueGoals, redGoals);
              const gameElo = elo?.get(game.id);
              const isOpen = !!gameElo && openGame === game.id;
              const toggle = () => setOpenGame(isOpen ? null : game.id);
              return (
                <li
                  key={game.id}
                  className={`match ${gameElo ? "is-expandable" : ""} ${isOpen ? "is-open" : ""}`}
                >
                  <div
                    className="match-line"
                    {...(gameElo && {
                      role: "button",
                      tabIndex: 0,
                      "aria-expanded": isOpen,
                      title: isOpen ? undefined : "Visa ELO-uträkning",
                      onClick: toggle,
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggle();
                        }
                      },
                    })}
                  >
                    <Lineup
                      team={game.team1}
                      side="blue"
                      won={blueWon}
                      elo={gameElo?.team1}
                    />
                    <Rod
                      goals={blueGoals}
                      of={beads}
                      side="blue"
                      won={blueWon}
                    />
                    <div className="match-score">
                      <span
                        className={`match-goals match-goals-blue ${blueWon ? "is-won" : ""}`}
                      >
                        {blueGoals}
                      </span>
                      <span className="match-score-sep">:</span>
                      <span
                        className={`match-goals match-goals-red ${blueWon ? "" : "is-won"}`}
                      >
                        {redGoals}
                      </span>
                    </div>
                    <Rod
                      goals={redGoals}
                      of={beads}
                      side="red"
                      won={!blueWon}
                    />
                    <Lineup
                      team={game.team2}
                      side="red"
                      won={!blueWon}
                      elo={gameElo?.team2}
                    />
                    <div className="match-meta">
                      <time dateTime={game.timestamp}>
                        {formatWhen(game.timestamp).map((part) => (
                          <span key={part}>{part}</span>
                        ))}
                      </time>
                      {showDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(game.id);
                          }}
                          className="match-delete"
                        >
                          <Trash2 size={13} />
                          Ta bort
                        </button>
                      )}
                    </div>
                  </div>

                  {isOpen && gameElo && <EloBreakdown game={gameElo} />}
                </li>
              );
            })}
          </ol>
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
