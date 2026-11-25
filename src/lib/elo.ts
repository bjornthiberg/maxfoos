// ELO rating model for 2v2 foosball.
//
// The whole model, in one place:
//
//   1. Everyone starts at START_RATING.
//   2. Games are replayed oldest → newest (within a season).
//   3. A team's rating is the average of its two players.
//   4. Expected score for team A vs team B:
//          E_A = 1 / (1 + 10^((R_B − R_A) / 400))          (E_A + E_B = 1)
//   5. After the game each player on a team moves by the same amount:
//          Δ = K × (S − E)      S = 1 for a win, 0 for a loss
//      so a win you were expected to get pays little, an upset pays a lot,
//      and what one team gains the other loses.
//   6. Guests have no rating of their own: they always count as START_RATING
//      in their team's average and are never updated or ranked.
//
// Replaying a season is a single pass over its games (microseconds for
// hundreds of games), so ratings are derived from the raw results rather
// than stored anywhere.

import type { Game } from "../services/api";

export const START_RATING = 1000;
export const K_FACTOR = 32;

/** One player's side of one game. */
export interface EloPlayerChange {
  name: string;
  guest: boolean;
  before: number; // exact (unrounded) rating going in
  after: number; // exact rating coming out (same as before for guests)
}

/** One team's side of one game. */
export interface EloTeamChange {
  players: [EloPlayerChange, EloPlayerChange];
  rating: number; // team average going in
  expected: number; // E: win probability, 0..1
  score: 0 | 1; // S: actual outcome
  delta: number; // K × (S − E), applied to each non-guest player
}

/** Everything needed to explain the rating change from one game. */
export interface EloGame {
  team1: EloTeamChange;
  team2: EloTeamChange;
}

export interface EloRating {
  name: string;
  rating: number; // exact
  gamesPlayed: number;
}

export interface EloResult {
  /** Current ratings, highest first; guests excluded. */
  ratings: EloRating[];
  /** Per-game breakdown, keyed by game id. */
  games: Map<string, EloGame>;
}

/** Win probability for a team rated `rating` against one rated `opponent`. */
export function expectedScore(rating: number, opponent: number): number {
  return 1 / (1 + Math.pow(10, (opponent - rating) / 400));
}

/** Rounded rating change as it shows up in the standings. */
export function shownDelta(p: EloPlayerChange): number {
  return Math.round(p.after) - Math.round(p.before);
}

export function computeElo(games: Game[], guests: Iterable<string>): EloResult {
  const isGuest = new Set(guests);
  const rating = new Map<string, number>();
  const played = new Map<string, number>();
  const ratingOf = (p: string) =>
    isGuest.has(p) ? START_RATING : (rating.get(p) ?? START_RATING);

  const chronological = [...games].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const breakdown = new Map<string, EloGame>();

  for (const game of chronological) {
    const lineup1 = [game.team1.player1, game.team1.player2] as const;
    const lineup2 = [game.team2.player1, game.team2.player2] as const;

    const r1 = (ratingOf(lineup1[0]) + ratingOf(lineup1[1])) / 2;
    const r2 = (ratingOf(lineup2[0]) + ratingOf(lineup2[1])) / 2;

    const settle = (
      lineup: readonly [string, string],
      teamRating: number,
      opponentRating: number,
      won: boolean,
    ): EloTeamChange => {
      const expected = expectedScore(teamRating, opponentRating);
      const score = won ? 1 : 0;
      const delta = K_FACTOR * (score - expected);

      const change = (name: string): EloPlayerChange => {
        const guest = isGuest.has(name);
        const before = ratingOf(name);
        return { name, guest, before, after: guest ? before : before + delta };
      };

      return {
        players: [change(lineup[0]), change(lineup[1])],
        rating: teamRating,
        expected,
        score,
        delta,
      };
    };

    const team1 = settle(lineup1, r1, r2, game.winner === "team1");
    const team2 = settle(lineup2, r2, r1, game.winner === "team2");

    // Apply only after both sides are settled, so both use pre-game ratings
    for (const p of [...team1.players, ...team2.players]) {
      if (p.guest) continue;
      rating.set(p.name, p.after);
      played.set(p.name, (played.get(p.name) ?? 0) + 1);
    }

    breakdown.set(game.id, { team1, team2 });
  }

  const ratings = [...rating.entries()]
    .map(([name, r]) => ({ name, rating: r, gamesPlayed: played.get(name)! }))
    .sort((a, b) => b.rating - a.rating);

  return { ratings, games: breakdown };
}
