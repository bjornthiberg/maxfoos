// Per-position record for one player. In a Team, player1 plays back and
// player2 plays forward (see AddGameForm / GameList).

import type { Game } from "../services/api";

export type Position = "back" | "forward";

export interface PositionRecord {
  games: number;
  wins: number;
  losses: number;
  goalDifference: number;
}

export function positionStats(
  name: string,
  games: Game[],
): Record<Position, PositionRecord> {
  const empty = (): PositionRecord => ({
    games: 0,
    wins: 0,
    losses: 0,
    goalDifference: 0,
  });
  const stats = { back: empty(), forward: empty() };

  for (const game of games) {
    for (const side of ["team1", "team2"] as const) {
      const team = game[side];
      const position: Position | null =
        team.player1 === name ? "back" : team.player2 === name ? "forward" : null;
      if (!position) continue;

      const other = side === "team1" ? "team2" : "team1";
      const s = stats[position];
      s.games++;
      if (game.winner === side) s.wins++;
      else s.losses++;
      s.goalDifference += game.score[side] - game.score[other];
    }
  }

  return stats;
}
