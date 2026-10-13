import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import type { Game } from "../services/api";

interface QuartetGameFinderProps {
  allPlayers: string[];
  games: Game[];
}

interface Combo {
  team1: { player1: string; player2: string };
  team2: { player1: string; player2: string };
}

function getCombos(players: string[]): Combo[] {
  const [a, b, c, d] = players;
  return [
    { team1: { player1: a, player2: b }, team2: { player1: c, player2: d } },
    { team1: { player1: a, player2: c }, team2: { player1: b, player2: d } },
    { team1: { player1: a, player2: d }, team2: { player1: b, player2: c } },
  ];
}

function formatTeam(team: { player1: string; player2: string }): string {
  return `${team.player1} + ${team.player2}`;
}

function countPlayed(combo: Combo, games: Game[]): number {
  const normalize = (p1: string, p2: string) => [p1, p2].sort().join(",");
  const t1 = normalize(combo.team1.player1, combo.team1.player2);
  const t2 = normalize(combo.team2.player1, combo.team2.player2);
  return games.filter((g) => {
    const gt1 = normalize(g.team1.player1, g.team1.player2);
    const gt2 = normalize(g.team2.player1, g.team2.player2);
    return (gt1 === t1 && gt2 === t2) || (gt1 === t2 && gt2 === t1);
  }).length;
}

export default function QuartetGameFinder({
  allPlayers,
  games,
}: QuartetGameFinderProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [suggestedIndex, setSuggestedIndex] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const togglePlayer = (name: string) => {
    setSelectedPlayers((current) =>
      current.includes(name)
        ? current.filter((p) => p !== name)
        : [...current, name],
    );
    setHasSearched(false);
  };

  const handleSearch = () => {
    const results = getCombos(selectedPlayers);
    setCombos(results);
    setSuggestedIndex(Math.floor(Math.random() * results.length));
    setHasSearched(true);
  };

  const handleReset = () => {
    setSelectedPlayers([]);
    setCombos([]);
    setSuggestedIndex(null);
    setHasSearched(false);
  };

  const isFull = selectedPlayers.length === 4;

  return (
    <section className="cabinet glow-yellow">
      <div className="crt">
        <div className="screen-head">
          <h2 className="screen-title">Föreslå match</h2>
        </div>

        {!hasSearched && (
          <p className="screen-prompt">
            Välj 4 spelare för att se möjliga lagkombinationer.
            <span className="screen-counter">{selectedPlayers.length}/4</span>
          </p>
        )}

        {hasSearched && (
          <div className="matchup">
            {suggestedIndex !== null && (
              <div className="matchup-pick">
                <span className="matchup-team matchup-team-blue">
                  {formatTeam(combos[suggestedIndex].team1)}
                </span>
                <span className="vs">VS</span>
                <span className="matchup-team matchup-team-red">
                  {formatTeam(combos[suggestedIndex].team2)}
                </span>
              </div>
            )}
            <table className="combo-table">
              <thead>
                <tr>
                  <th>Lag 1</th>
                  <th>Lag 2</th>
                  <th>Spelade</th>
                </tr>
              </thead>
              <tbody>
                {combos.map((combo, index) => (
                  <tr
                    key={index}
                    className={index === suggestedIndex ? "is-suggested" : ""}
                  >
                    <td>{formatTeam(combo.team1)}</td>
                    <td>{formatTeam(combo.team2)}</td>
                    <td>{countPlayed(combo, games)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="cabinet-deck cabinet-deck-stack">
        <div className="roster">
          {allPlayers.map((name) => {
            const slot = selectedPlayers.indexOf(name);
            return (
              <button
                key={name}
                type="button"
                className="roster-chip"
                aria-pressed={slot !== -1}
                disabled={isFull && slot === -1}
                onClick={() => togglePlayer(name)}
              >
                {slot !== -1 && <span className="roster-slot">P{slot + 1}</span>}
                {name}
              </button>
            );
          })}
        </div>

        <div className="roster-actions">
          <button
            onClick={handleSearch}
            disabled={!isFull}
            className="arcade-btn"
          >
            <Search size={18} />
            Hitta matcher
          </button>
          <button
            onClick={handleReset}
            disabled={selectedPlayers.length === 0}
            className="arcade-btn arcade-btn-ghost"
          >
            <RotateCcw size={18} />
            Rensa
          </button>
        </div>
      </div>
    </section>
  );
}
