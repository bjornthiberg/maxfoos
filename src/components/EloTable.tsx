import { useState } from "react";
import { FormPips, PlayerRow } from "./Standing";
import type { Game, Player } from "../services/api";
import type { EloResult } from "../lib/elo";

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
  elo,
}: {
  games: Game[];
  players: Player[];
  elo: EloResult;
}) {
  // whose back/forward breakdown is open (one at a time)
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (name: string) => setOpen((o) => (o === name ? null : name));
  const players = elo.ratings.map((p) => ({
    ...p,
    elo: Math.round(p.rating),
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
            <PlayerRow
              key={player.name}
              rank={index + 1}
              name={player.name}
              columns={6}
              games={games}
              elo={elo}
              open={open === player.name}
              onToggle={() => toggle(player.name)}
              cells={
                <>
                  <td className="score-main">{player.elo}</td>
                  <td className={player.goalDifference >= 0 ? "" : "score-neg"}>
                    {player.goalDifference >= 0 ? "+" : ""}
                    {player.goalDifference}
                  </td>
                  <td>{player.gamesPlayed}</td>
                  <td>
                    <FormPips form={getForm(player.name, games)} />
                  </td>
                </>
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
