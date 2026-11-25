// Stats for two players on the same team. In a Team, player1 plays back and
// player2 plays forward.

import type { Game } from "../services/api";

export interface DuoRecord {
  games: number;
  wins: number;
  losses: number;
  goalDifference: number;
}

export interface Duo extends DuoRecord {
  players: [string, string]; // alphabetical
  /** true = win, oldest first */
  results: boolean[];
  /** record per lineup, keyed by who played back */
  byBack: Record<string, DuoRecord>;
}

const emptyRecord = (): DuoRecord => ({
  games: 0,
  wins: 0,
  losses: 0,
  goalDifference: 0,
});

const pairKey = (a: string, b: string) => [a, b].sort().join("\u0000");

function add(r: DuoRecord, won: boolean, goalDifference: number) {
  r.games++;
  if (won) r.wins++;
  else r.losses++;
  r.goalDifference += goalDifference;
}

/** Every pair that has played on the same team, keyed by `pairKey`. */
export function computeDuos(games: Game[]): Map<string, Duo> {
  const duos = new Map<string, Duo>();
  const chronological = [...games].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  for (const game of chronological) {
    for (const side of ["team1", "team2"] as const) {
      const { player1: back, player2: forward } = game[side];
      const other = side === "team1" ? "team2" : "team1";
      const won = game.winner === side;
      const gd = game.score[side] - game.score[other];

      const key = pairKey(back, forward);
      let duo = duos.get(key);
      if (!duo) {
        duo = {
          ...emptyRecord(),
          players: [back, forward].sort() as [string, string],
          results: [],
          byBack: {},
        };
        duos.set(key, duo);
      }
      add(duo, won, gd);
      duo.results.push(won);
      add((duo.byBack[back] ??= emptyRecord()), won, gd);
    }
  }

  return duos;
}

export function findDuo(
  duos: Map<string, Duo>,
  a: string,
  b: string,
): Duo | undefined {
  return duos.get(pairKey(a, b));
}

export const winRate = (r: DuoRecord) => (r.games > 0 ? r.wins / r.games : 0);
