import { Rank, FormPips } from "./Standing";
import type { Game, Player } from "../services/api";

interface EloPlayer {
  name: string;
  elo: number;
  change: number;
  gamesPlayed: number;
}

function calculateElo(games: Game[], excluded: Set<string>): EloPlayer[] {
  const K = 32;
  const elos: Record<string, number> = {};
  const gamesPlayed: Record<string, number> = {};

  const players = new Set<string>();
  games.forEach((g) => {
    [
      g.team1.player1,
      g.team1.player2,
      g.team2.player1,
      g.team2.player2,
    ].forEach((p) => players.add(p));
  });
  players.forEach((p) => {
    elos[p] = 1000;
    gamesPlayed[p] = 0;
  });

  const sorted = [...games].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  sorted.forEach((game) => {
    const t1 = [game.team1.player1, game.team1.player2];
    const t2 = [game.team2.player1, game.team2.player2];

    // Excluded players (guests) always contribute the default rating
    const rating = (p: string) => (excluded.has(p) ? 1000 : elos[p]);

    const avg1 = (rating(t1[0]) + rating(t1[1])) / 2;
    const avg2 = (rating(t2[0]) + rating(t2[1])) / 2;

    const exp1 = 1 / (1 + Math.pow(10, (avg2 - avg1) / 400));
    const exp2 = 1 - exp1;

    const s1 = game.winner === "team1" ? 1 : 0;
    const s2 = 1 - s1;

    t1.forEach((p) => {
      if (excluded.has(p)) return;
      elos[p] += K * (s1 - exp1);
      gamesPlayed[p]++;
    });
    t2.forEach((p) => {
      if (excluded.has(p)) return;
      elos[p] += K * (s2 - exp2);
      gamesPlayed[p]++;
    });
  });

  return Array.from(players)
    .filter((name) => !excluded.has(name))
    .map((name) => ({
      name,
      elo: Math.round(elos[name]),
      change: Math.round(elos[name] - 1000),
      gamesPlayed: gamesPlayed[name],
    }))
    .sort((a, b) => b.elo - a.elo);
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

export default function EloTable({
  games,
  players: playerStats,
  excludedPlayers = [],
}: {
  games: Game[];
  players: Player[];
  excludedPlayers?: string[];
}) {
  const excluded = new Set(excludedPlayers);
  const players = calculateElo(games, excluded).map((p) => ({
    ...p,
    goalDifference:
      playerStats.find((s) => s.name === p.name)?.goalDifference ?? 0,
  }));

  if (players.length === 0) {
    return <p className="screen-prompt">Inga matcher spelade än.</p>;
  }

  return (
    <div className="table-scroll">
      <table className="score-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Spelare</th>
            <th>ELO</th>
            <th>+/-</th>
            <th>M</th>
            <th>Form</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr key={player.name}>
              <td>
                <Rank position={index + 1} />
              </td>
              <td className="score-name">{player.name}</td>
              <td className="score-main">{player.elo}</td>
              <td className={player.goalDifference >= 0 ? "" : "score-neg"}>
                {player.goalDifference >= 0 ? "+" : ""}
                {player.goalDifference}
              </td>
              <td>{player.gamesPlayed}</td>
              <td>
                <FormPips form={getForm(player.name, games)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
