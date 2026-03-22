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
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [suggestedIndex, setSuggestedIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...selectedPlayers];
    newPlayers[index] = value;
    setSelectedPlayers(newPlayers);
    setHasSearched(false);
    setError("");
  };

  const handleSearch = () => {
    if (selectedPlayers.some((p) => !p)) {
      setError("Välj alla 4 spelare");
      return;
    }
    if (new Set(selectedPlayers).size !== 4) {
      setError("Alla 4 spelare måste vara olika");
      return;
    }
    const results = getCombos(selectedPlayers);
    setCombos(results);
    setSuggestedIndex(Math.floor(Math.random() * results.length));
    setHasSearched(true);
    setError("");
  };

  const handleReset = () => {
    setSelectedPlayers(["", "", "", ""]);
    setCombos([]);
    setSuggestedIndex(null);
    setHasSearched(false);
    setError("");
  };

  const getAvailablePlayers = (currentIndex: number) => {
    const selectedOthers = selectedPlayers.filter(
      (p, i) => i !== currentIndex && p !== "",
    );
    return allPlayers.filter((p) => !selectedOthers.includes(p));
  };

  const isSearchDisabled =
    selectedPlayers.some((p) => !p) || new Set(selectedPlayers).size !== 4;

  return (
    <div className="quartet-finder-container">
      <h2>Föreslå match</h2>
      <p className="quartet-description">
        Välj 4 spelare för att se möjliga lagkombinationer.
      </p>

      <div className="quartet-form">
        <div className="player-selectors">
          {selectedPlayers.map((player, index) => (
            <div key={index} className="form-group">
              <label>Spelare {index + 1}</label>
              <select
                value={player}
                onChange={(e) => handlePlayerChange(index, e.target.value)}
                className="player-select"
              >
                <option value="">Välj spelare...</option>
                {getAvailablePlayers(index).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                {player && !getAvailablePlayers(index).includes(player) && (
                  <option value={player}>{player}</option>
                )}
              </select>
            </div>
          ))}
        </div>

        <div className="quartet-actions">
          <button
            onClick={handleSearch}
            disabled={isSearchDisabled}
            className="submit-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              justifyContent: "center",
            }}
          >
            <Search size={18} />
            Hitta matcher
          </button>
          <button
            onClick={handleReset}
            className="reset-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              justifyContent: "center",
            }}
          >
            <RotateCcw size={18} />
            Rensa
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      {hasSearched && (
        <div className="quartet-results">
          {suggestedIndex !== null && (
            <div className="suggested-game">
              <div className="suggested-game-label">Förslag</div>
              <div className="suggested-game-teams">
                <span>{formatTeam(combos[suggestedIndex].team1)}</span>
                <span className="vs">vs</span>
                <span>{formatTeam(combos[suggestedIndex].team2)}</span>
              </div>
            </div>
          )}
          <table className="game-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Lag 1</th>
                <th>Lag 2</th>
                <th>Spelade</th>
              </tr>
            </thead>
            <tbody>
              {combos.map((combo, index) => {
                const played = countPlayed(combo, games);
                return (
                  <tr
                    key={index}
                    className={index === suggestedIndex ? "suggested-row" : ""}
                  >
                    <td>{index + 1}</td>
                    <td>{formatTeam(combo.team1)}</td>
                    <td>{formatTeam(combo.team2)}</td>
                    <td style={{ color: "#71717a", fontWeight: 600 }}>
                      {played}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
